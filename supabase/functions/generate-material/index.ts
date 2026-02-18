import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, level, type, length } = await req.json();
    if (!topic || !level || !type) {
      return new Response(JSON.stringify({ error: "topic, level, and type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const charTarget = length === "short" ? 700 : length === "long" ? 2000 : 1400;

    const typePrompts: Record<string, string> = {
      dialogue: `Generate a natural Japanese conversation about "${topic}" for JLPT ${level.toUpperCase()} learners.

Requirements:
- Use vocabulary appropriate for ${level.toUpperCase()}
- Include furigana for ALL kanji using format: 漢字（かんじ）
- 6-8 dialogue turns between 2 characters
- Each line should have the speaker name
- Target approximately ${charTarget} Japanese characters total
- End with a cultural tip related to the topic

Return using the provided tool.`,

      reading: `Generate a Japanese reading passage about "${topic}" for JLPT ${level.toUpperCase()} learners.

Requirements:
- Use vocabulary and grammar appropriate for ${level.toUpperCase()}
- Include furigana for ALL kanji using format: 漢字（かんじ）
- Write in paragraph form, ${charTarget} characters approximately
- Include a mix of simple and moderately complex sentences
- Topic should be engaging and culturally relevant

Return using the provided tool.`,

      grammar: `Create a Japanese grammar lesson about "${topic}" for JLPT ${level.toUpperCase()} learners.

Requirements:
- Explain the grammar point clearly in Indonesian
- Include furigana for ALL kanji using format: 漢字（かんじ）
- Provide 4-6 example sentences with translations
- Show common mistakes to avoid
- Target approximately ${charTarget} characters for examples
- Include practice exercises at the end

Return using the provided tool.`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 8192,
        messages: [
          {
            role: "system",
            content: "You are a Japanese language education content creator. Create high-quality learning materials. All explanations should be in Indonesian. Always include furigana for kanji. Always respond using the provided tool.",
          },
          { role: "user", content: typePrompts[type] || typePrompts.dialogue },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "learning_material",
              description: "Return structured learning material",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title for the material in Japanese with Indonesian subtitle" },
                  content_html: {
                    type: "string",
                    description: "The main content as HTML. Use <ruby> tags for furigana (e.g. <ruby>漢字<rt>かんじ</rt></ruby>). Use <p>, <h3>, <strong>, <em> for formatting. For dialogues use <p><strong>Speaker:</strong> line</p> format.",
                  },
                  vocabulary: {
                    type: "array",
                    description: "Key vocabulary from the material",
                    items: {
                      type: "object",
                      properties: {
                        kanji: { type: "string" },
                        kana: { type: "string" },
                        meaning: { type: "string", description: "Meaning in Indonesian" },
                      },
                      required: ["kanji", "kana", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  grammar_notes: {
                    type: "array",
                    description: "Grammar points used in the material",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string" },
                        explanation: { type: "string", description: "Explanation in Indonesian" },
                      },
                      required: ["pattern", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  cultural_note: { type: "string", description: "Cultural context note in Indonesian" },
                },
                required: ["title", "content_html", "vocabulary", "grammar_notes", "cultural_note"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "learning_material" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }), {
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
    console.error("generate-material error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
