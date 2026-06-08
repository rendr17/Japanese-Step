import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { chatCompletions } from "../_shared/ai.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { supabase, user } = authResult;

    const { material_id, title, content_excerpt, level, category, count = 5 } = await req.json();

    if (!content_excerpt) {
      return new Response(JSON.stringify({ error: "content_excerpt required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(content_excerpt.slice(0, 2000))
    ).then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    const cacheKey = material_id ? `${material_id}:${contentHash}` : `practice:${contentHash}`;

    const { data: cached } = await supabase
      .from("material_quiz_cache")
      .select("questions")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.questions) {
      return new Response(JSON.stringify({ questions: cached.questions, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Kamu pembuat kuis bahasa Jepang. Buat ${count} soal pilihan ganda berdasarkan materi pembelajaran.
Level: ${level ?? "n5"}. Kategori: ${category ?? "grammar"}.
Judul materi: ${title ?? "Materi belajar"}

ATURAN:
- question_text dalam bahasa Jepang (bisa campur Indonesia untuk petunjuk)
- Tepat 4 pilihan jawaban (options)
- correct_answer adalah index 0-3
- explanation dalam Bahasa Indonesia
- Soal harus relevan dengan konten materi yang diberikan`;

    const response = await chatCompletions({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Konten materi:\n${content_excerpt.slice(0, 3000)}\n\nBuat ${count} soal MCQ.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "generate_lesson_quiz",
          description: "Generate lesson quiz questions",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_text: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correct_answer: { type: "integer", minimum: 0, maximum: 3 },
                    explanation: { type: "string" },
                  },
                  required: ["question_text", "options", "correct_answer", "explanation"],
                },
              },
            },
            required: ["questions"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "generate_lesson_quiz" } },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit tercapai" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const questions = parsed.questions ?? [];

    await supabase.from("material_quiz_cache").upsert({
      material_id: material_id || null,
      cache_key: cacheKey,
      questions,
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify({ questions, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
