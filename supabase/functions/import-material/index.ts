import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { chatCompletions } from "../_shared/ai.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { text, source_category, template, language, level } = await req.json();
    if (!text || !source_category) {
      return new Response(JSON.stringify({ error: "text and source_category are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedText = text.slice(0, 50000);
    const lang = language === "english" ? "English" : "Indonesian";

    let templateInstruction = "";
    if (template === "minna_no_nihongo") {
      templateInstruction = `
This text is from "Minna no Nihongo" textbook. Try to detect and map content to these sections:
- Bunkei (文型) - Sentence patterns
- Reibun (例文) - Example sentences  
- Kaiwa (会話) - Conversation/Dialogue
- Kotoba (ことば) - Vocabulary list
- Renshuu (練習) - Practice exercises
- Mondai (問題) - Test questions
If the text doesn't match this structure, use a generic structure instead.`;
    }

    const categoryMap: Record<string, string> = {
      textbook: "educational textbook content",
      article: "a Japanese article or reading material",
      dialogue: "a Japanese conversation or dialogue",
      notes: "personal study notes about Japanese",
    };
    const categoryDesc = categoryMap[source_category] || "Japanese learning content";

    const systemPrompt = `You are an expert Japanese language education content analyzer. Your job is to analyze raw text from ${categoryDesc} and produce structured learning materials. All explanations should be in ${lang}. ${templateInstruction}

IMPORTANT RULES:
- Detect structure: chapters, subtitles, vocabulary lists, grammar patterns, dialogues, exercises
- Generate a concise summary (5-10 bullet points)
- Extract vocabulary with kanji, kana, meaning, and estimated JLPT level
- Extract grammar patterns with explanations
- Add cultural notes if relevant
- Suggest a title for the material
- Generate an Indonesian translation of the main content
- If the text is too long, focus on the most important parts
- Do NOT reproduce copyrighted content verbatim in full; create study notes and summaries instead`;

    const response = await chatCompletions({
      max_tokens: 16384,
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze and structure this Japanese learning content (estimated level: ${level || "auto-detect"}):\n\n${truncatedText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "import_analysis",
              description: "Return structured analysis of imported material",
              parameters: {
                type: "object",
                properties: {
                  suggested_title: { type: "string", description: "Suggested title for the material" },
                  summary: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-10 bullet point summary of the content",
                  },
                  sections: {
                    type: "array",
                    description: "Structured sections of the content",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content_html: { type: "string", description: "Section content as clean HTML with <ruby> tags for furigana" },
                        section_type: { type: "string", enum: ["bunkei", "reibun", "kaiwa", "kotoba", "renshuu", "mondai", "summary", "notes", "grammar", "reading", "other"] },
                      },
                      required: ["title", "content_html", "section_type"],
                      additionalProperties: false,
                    },
                  },
                  vocabulary: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        kanji: { type: "string" },
                        kana: { type: "string" },
                        meaning: { type: "string" },
                        level: { type: "string", description: "Estimated JLPT level: n5, n4, n3, n2, n1" },
                      },
                      required: ["kana", "meaning"],
                      additionalProperties: false,
                    },
                  },
                  grammar_notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string" },
                        explanation: { type: "string" },
                      },
                      required: ["pattern", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  cultural_note: { type: "string", description: "Cultural context note" },
                  indonesian_translation: { type: "string", description: "Indonesian translation of the main content" },
                  detected_level: { type: "string", description: "Detected JLPT level of the content" },
                  suggested_category: { type: "string", enum: ["grammar", "reading", "conversation", "vocabulary"] },
                  suggested_tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Suggested tags for the material",
                  },
                },
                required: ["suggested_title", "summary", "sections", "vocabulary", "grammar_notes", "indonesian_translation", "detected_level", "suggested_category", "suggested_tags"],
                additionalProperties: false,
              },
            },
          },
      ],
      tool_choice: { type: "function", function: { name: "import_analysis" } },
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
    if (!toolCall) {
      const finishReason = data.choices?.[0]?.finish_reason;
      console.error("No tool call. finish_reason:", finishReason);
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-material error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
