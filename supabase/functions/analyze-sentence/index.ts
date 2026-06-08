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
    const { sentence } = await req.json();
    if (!sentence || typeof sentence !== "string" || sentence.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Sentence is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await chatCompletions({
      messages: [
          {
            role: "system",
            content: `You are a Japanese language expert and teacher. Analyze the given Japanese sentence thoroughly. Provide detailed word-by-word breakdown, grammar explanation, politeness level, JLPT level estimate, and cultural notes. All explanations should be in Indonesian. Always respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Analyze this Japanese sentence: "${sentence.trim()}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "sentence_analysis",
              description: "Return complete analysis of a Japanese sentence",
              parameters: {
                type: "object",
                properties: {
                  tokens: {
                    type: "array",
                    description: "Word-by-word breakdown of the sentence",
                    items: {
                      type: "object",
                      properties: {
                        kanji: { type: "string", description: "Kanji form (or original form if no kanji)" },
                        kana: { type: "string", description: "Hiragana/katakana reading" },
                        meaning: { type: "string", description: "Meaning in Indonesian" },
                        type: { type: "string", description: "Part of speech (Noun, Verb, Adjective, Particle, Adverb, Conjunction, etc.)" },
                      },
                      required: ["kanji", "kana", "meaning", "type"],
                      additionalProperties: false,
                    },
                  },
                  grammar: {
                    type: "object",
                    description: "Grammar structure explanation",
                    properties: {
                      pattern: { type: "string", description: "Main grammar pattern used" },
                      structure: { type: "string", description: "Sentence structure breakdown (e.g. Subject + Object + Verb)" },
                      explanation: { type: "string", description: "Detailed grammar explanation in Indonesian" },
                    },
                    required: ["pattern", "structure", "explanation"],
                    additionalProperties: false,
                  },
                  politeness: {
                    type: "string",
                    enum: ["casual", "polite", "formal", "honorific"],
                    description: "Politeness level of the sentence",
                  },
                  jlpt_level: {
                    type: "string",
                    enum: ["N5", "N4", "N3", "N2", "N1"],
                    description: "Estimated JLPT level",
                  },
                  cultural_notes: {
                    type: "string",
                    description: "Cultural context or usage notes in Indonesian, or empty string if none",
                  },
                  similar_sentences: {
                    type: "array",
                    description: "3 similar practice sentences using the same grammar pattern",
                    items: {
                      type: "object",
                      properties: {
                        japanese: { type: "string" },
                        meaning: { type: "string", description: "Meaning in Indonesian" },
                      },
                      required: ["japanese", "meaning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tokens", "grammar", "politeness", "jlpt_level", "cultural_notes", "similar_sentences"],
                additionalProperties: false,
              },
            },
          },
      ],
      tool_choice: { type: "function", function: { name: "sentence_analysis" } },
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
    console.error("analyze-sentence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
