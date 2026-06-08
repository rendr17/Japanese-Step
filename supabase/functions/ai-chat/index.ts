import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { chatCompletions } from "../_shared/ai.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { messages, userContext } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context-aware system prompt
    const contextParts: string[] = [];
    if (userContext?.learning_path) {
      contextParts.push(`Jalur belajar: ${userContext.learning_path === "jlpt_academic" ? "JLPT Akademik" : "JFT Praktis"}`);
    }
    if (userContext?.level) {
      contextParts.push(`Level saat ini: ${userContext.level.toUpperCase()}`);
    }
    if (userContext?.recent_materials?.length) {
      contextParts.push(`Materi terakhir dipelajari: ${userContext.recent_materials.join(", ")}`);
    }
    if (userContext?.vocab_count) {
      contextParts.push(`Total kosakata: ${userContext.vocab_count} kata`);
    }

    const contextBlock = contextParts.length > 0
      ? `\n\nKonteks pengguna:\n${contextParts.map(p => `- ${p}`).join("\n")}\n\nGunakan konteks ini untuk mempersonalisasi jawaban. Sesuaikan tingkat kesulitan materi dengan level pengguna.`
      : "";

    const systemPrompt = `Kamu adalah asisten belajar bahasa Jepang bernama "Sensei AI" untuk aplikasi Nihongo Step. Kamu ahli dalam:
- Tata bahasa Jepang (grammar) dari N5 sampai N1
- Etimologi dan mnemonik kanji
- Latihan percakapan dan roleplay
- Koreksi terjemahan
- Membuat kuis dan latihan soal

Panduan:
1. Jawab dalam Bahasa Indonesia kecuali diminta sebaliknya
2. Gunakan contoh kalimat Jepang dengan furigana jika memungkinkan (format: 漢字（かんじ）)
3. Untuk perintah /quiz [topik]: buat 5 soal pilihan ganda tentang topik tersebut
4. Untuk perintah /explain [grammar]: jelaskan pola grammar secara detail dengan contoh
5. Untuk perintah /practice: mulai sesi roleplay percakapan dalam bahasa Jepang
6. Gunakan emoji yang relevan untuk membuat jawaban lebih menarik
7. Jika pengguna membuat kesalahan, koreksi dengan lembut dan jelaskan alasannya
8. Format jawaban dengan markdown untuk keterbacaan yang baik${contextBlock}`;

    const response = await chatCompletions({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
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
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
