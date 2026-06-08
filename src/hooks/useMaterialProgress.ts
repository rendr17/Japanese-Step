import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export function useMaterialProgress(materialId: string | undefined) {
  return useQuery({
    queryKey: ["material-progress", materialId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !materialId) return null;
      const { data } = await supabase
        .from("user_material_progress" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("material_id", materialId)
        .maybeSingle();
      return data;
    },
    enabled: !!materialId,
  });
}

export function useUpdateMaterialProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      materialId,
      scrollProgress,
      completed,
    }: {
      materialId: string;
      scrollProgress?: number;
      completed?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload: Record<string, unknown> = {
        user_id: user.id,
        material_id: materialId,
        last_read_at: new Date().toISOString(),
      };
      if (scrollProgress !== undefined) payload.scroll_progress = scrollProgress;
      if (completed) payload.completed_at = new Date().toISOString();

      await supabase
        .from("user_material_progress" as any)
        .upsert(payload, { onConflict: "user_id,material_id" });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["material-progress", vars.materialId] });
    },
  });
}

export function useGenerateLessonQuiz() {
  return useMutation({
    mutationFn: async ({
      materialId,
      title,
      contentExcerpt,
      level,
      category,
    }: {
      materialId: string;
      title: string;
      contentExcerpt: string;
      level: string;
      category: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-lesson-quiz", {
        body: {
          material_id: materialId,
          title,
          content_excerpt: contentExcerpt,
          level,
          category,
          count: 5,
        },
      });
      if (error) throw error;
      return (data?.questions ?? []) as QuizQuestion[];
    },
  });
}

export function useSubmitQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      materialId,
      score,
      total,
      answers,
      passed,
      xpEarned,
    }: {
      materialId: string;
      score: number;
      total: number;
      answers: Array<{ questionIndex: number; selected: number; correct: boolean }>;
      passed: boolean;
      xpEarned: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("quiz_attempts" as any).insert({
        user_id: user.id,
        material_id: materialId,
        source_type: "material",
        score,
        total_questions: total,
        answers,
        passed,
        xp_earned: xpEarned,
      });

      if (passed) {
        await supabase
          .from("user_material_progress" as any)
          .upsert({
            user_id: user.id,
            material_id: materialId,
            scroll_progress: 100,
            completed_at: new Date().toISOString(),
            last_read_at: new Date().toISOString(),
          }, { onConflict: "user_id,material_id" });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["material-progress", vars.materialId] });
      qc.invalidateQueries({ queryKey: ["today-xp"] });
    },
  });
}
