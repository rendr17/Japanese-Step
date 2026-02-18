import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { exam_type, level, section, count = 5 } = await req.json();

    const sectionDescriptions: Record<string, string> = {
      vocabulary: "Soal kosakata: pilih arti kata, sinonim, atau penggunaan kata yang tepat dalam kalimat.",
      grammar: "Soal tata bahasa: pilih partikel, bentuk kata kerja, atau pola kalimat yang benar.",
      reading: "Soal pemahaman bacaan: baca teks pendek lalu jawab pertanyaan tentang isi/makna.",
      kanji_reading: "Soal cara baca kanji: pilih cara baca (furigana) yang benar untuk kanji yang diberikan.",
      conversation: "Soal percakapan: baca dialog pendek dan jawab pertanyaan tentang konteks/makna.",
      situational: "Soal situasional untuk care worker: diberikan situasi kerja (misal merawat pasien), pilih ungkapan Jepang yang paling tepat dan sopan.",
    };

    const examLabel = exam_type === "jft" ? "JFT Basic (Care Worker)" : `JLPT ${level.toUpperCase()}`;
    const sectionDesc = sectionDescriptions[section] || section;

    const systemPrompt = `Kamu adalah pembuat soal ujian bahasa Jepang profesional. Buat soal-soal berkualitas tinggi untuk ${examLabel}, bagian ${section}.

${sectionDesc}

ATURAN PENTING:
- Semua soal HARUS dalam bahasa Jepang (question_text dan options)
- Setiap soal memiliki tepat 4 pilihan jawaban
- correct_answer adalah index (0-3) dari jawaban yang benar
- difficulty antara 1 (mudah) sampai 5 (sulit), sesuaikan dengan level
- explanation dalam bahasa Indonesia untuk membantu pemahaman
- Untuk level N5/N4: gunakan kosakata dan grammar dasar
- Untuk level N3: intermediate
- Untuk level N2/N1: advanced
- Untuk JFT: fokus pada konteks kerja perawat (介護)`;

    const userPrompt = `Buat ${count} soal ${section} untuk ${examLabel}. Kembalikan sebagai JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate exam questions",
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
                        difficulty: { type: "integer", minimum: 1, maximum: 5 },
                      },
                      required: ["question_text", "options", "correct_answer", "explanation", "difficulty"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis, silakan top up." }), {
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

    const parsed = JSON.parse(toolCall.function.arguments);
    const questions = parsed.questions.map((q: any) => ({
      ...q,
      exam_type,
      level,
      section,
    }));

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
