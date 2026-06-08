import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PracticeQuestion {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  section?: string;
}

export function useGrammarDrillQuestions(level = "n5", count = 10) {
  return useQuery({
    queryKey: ["grammar-drill", level, count],
    queryFn: async (): Promise<PracticeQuestion[]> => {
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_type", "jlpt")
        .eq("level", level)
        .eq("section", "grammar")
        .limit(count * 2);

      if (error) throw error;
      const shuffled = (data ?? []).sort(() => Math.random() - 0.5).slice(0, count);
      return shuffled.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: (q.options as string[]) ?? [],
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? undefined,
        section: q.section,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useListeningVocab(count = 10) {
  return useQuery({
    queryKey: ["listening-drill-vocab", count],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("vocab_bank")
        .select("*")
        .eq("user_id", user.id)
        .limit(50);

      if (error) throw error;
      return (data ?? []).sort(() => Math.random() - 0.5).slice(0, count);
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSavePracticeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: {
      sessionType: string;
      topic?: string;
      score: number;
      totalQuestions: number;
      durationSeconds: number;
      xpEarned: number;
      metadata?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("practice_sessions" as any).insert({
        user_id: user.id,
        session_type: session.sessionType,
        topic: session.topic,
        score: session.score,
        total_questions: session.totalQuestions,
        duration_seconds: session.durationSeconds,
        xp_earned: session.xpEarned,
        metadata: session.metadata ?? {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today-xp"] });
    },
  });
}

export async function generateAiQuiz(topic: string, level: string): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: {
      messages: [{ role: "user", content: `/quiz ${level} ${topic}` }],
      structured: true,
      mode: "quiz",
    },
  });
  if (error) throw error;
  return (data?.questions ?? []) as PracticeQuestion[];
}
