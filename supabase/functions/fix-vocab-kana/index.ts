import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const containsKanji = (text: string) => /[\u4E00-\u9FFF]/.test(text);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch vocab where kana contains kanji characters
    const { data: allVocab, error: fetchError } = await supabase
      .from("vocab_bank")
      .select("id, kanji, kana")
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    const badEntries = (allVocab ?? []).filter(
      (v) => v.kanji && containsKanji(v.kana)
    );

    if (badEntries.length === 0) {
      return new Response(JSON.stringify({ fixed: 0, total: 0, message: "Semua kana sudah benar!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Process in batches of 20
    const batchSize = 20;
    let totalFixed = 0;

    for (let i = 0; i < badEntries.length; i += batchSize) {
      const batch = badEntries.slice(i, i + batchSize);
      const wordList = batch.map((v) => v.kanji).join("\n");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a Japanese language expert. Given a list of Japanese words (kanji), return their correct kana readings (hiragana).
Return ONLY a JSON array of objects with "kanji" and "kana" fields. No explanation.
Example input: 食べる\n飲む
Example output: [{"kanji":"食べる","kana":"たべる"},{"kanji":"飲む","kana":"のむ"}]`,
            },
            { role: "user", content: wordList },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI error:", await aiResponse.text());
        continue;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content ?? "";

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      try {
        const readings: { kanji: string; kana: string }[] = JSON.parse(jsonMatch[0]);
        const readingMap = new Map(readings.map((r) => [r.kanji, r.kana]));

        for (const entry of batch) {
          const correctKana = readingMap.get(entry.kanji!);
          if (correctKana && !containsKanji(correctKana)) {
            const { error: updateError } = await supabase
              .from("vocab_bank")
              .update({ kana: correctKana })
              .eq("id", entry.id);
            if (!updateError) totalFixed++;
          }
        }
      } catch {
        console.error("Failed to parse AI response for batch");
      }
    }

    return new Response(
      JSON.stringify({ fixed: totalFixed, total: badEntries.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fix-vocab-kana error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
