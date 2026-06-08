import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletions } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kanji } = await req.json();
    if (!kanji || typeof kanji !== "string" || kanji.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Kanji is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await chatCompletions({
      messages: [
          {
            role: "system",
            content:
              "You are a Japanese language expert. Given a kanji word, return its reading (kana), meaning in Indonesian, and an example sentence in Japanese. Always respond using the provided tool.",
          },
          {
            role: "user",
            content: `Provide the reading, meaning, and example sentence for: ${kanji.trim()}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "vocab_info",
              description: "Return vocabulary information for a kanji word",
              parameters: {
                type: "object",
                properties: {
                  kana: { type: "string", description: "Hiragana/katakana reading" },
                  meaning: { type: "string", description: "Meaning in Indonesian" },
                  example_sentence: { type: "string", description: "Example sentence in Japanese" },
                },
                required: ["kana", "meaning", "example_sentence"],
                additionalProperties: false,
              },
            },
          },
      ],
      tool_choice: { type: "function", function: { name: "vocab_info" } },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit habis, silakan top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vocab-ai-fill error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
