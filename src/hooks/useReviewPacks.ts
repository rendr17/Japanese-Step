import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReviewPacks() {
  return useQuery({
    queryKey: ["review-packs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("review_packs" as any)
        .select("*")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useGenerateReviewPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (examResultId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: result } = await supabase
        .from("exam_results")
        .select("*")
        .eq("id", examResultId)
        .single();

      if (!result) return;

      const wrongAnswers = ((result.answers as any[]) ?? []).filter((a) => !a.correct);
      if (wrongAnswers.length === 0) return;

      const questionIds = wrongAnswers.map((a) => a.question_id).filter(Boolean);
      const { data: questions } = await supabase
        .from("exam_questions")
        .select("*")
        .in("id", questionIds.slice(0, 10));

      const reviewQuestions = (questions ?? []).map((q) => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        section: q.section,
      }));

      if (reviewQuestions.length === 0) return;

      await supabase.from("review_packs" as any).insert({
        user_id: user.id,
        exam_result_id: examResultId,
        title: `Review Pack — ${result.exam_type.toUpperCase()} ${result.level.toUpperCase()}`,
        questions: reviewQuestions,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-packs"] }),
  });
}

export function useCompleteReviewPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packId: string) => {
      await supabase
        .from("review_packs" as any)
        .update({ completed_at: new Date().toISOString() })
        .eq("id", packId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-packs"] }),
  });
}
