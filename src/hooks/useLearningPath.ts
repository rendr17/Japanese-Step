import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearningUnit {
  id: string;
  path: string;
  level: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons?: LearningLesson[];
}

export interface LearningLesson {
  id: string;
  unit_id: string;
  material_id: string | null;
  starter_key: string | null;
  title: string;
  description: string | null;
  order_index: number;
  xp_reward: number;
  progress?: { status: string; score: number | null; completed_at: string | null };
}

export function useLearningPath(path?: string, level?: string) {
  return useQuery({
    queryKey: ["learning-path", path, level],
    queryFn: async (): Promise<LearningUnit[]> => {
      let query = supabase
        .from("learning_units" as any)
        .select("*, learning_lessons(*)")
        .order("order_index");

      if (path) query = query.eq("path", path);
      if (level) query = query.eq("level", level);

      const { data: units, error } = await query;
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      let progressMap = new Map<string, { status: string; score: number | null; completed_at: string | null }>();

      if (user) {
        const { data: progress } = await supabase
          .from("user_lesson_progress" as any)
          .select("*")
          .eq("user_id", user.id);

        for (const p of progress ?? []) {
          progressMap.set(p.lesson_id, {
            status: p.status,
            score: p.score,
            completed_at: p.completed_at,
          });
        }
      }

      return (units ?? []).map((unit: any) => ({
        ...unit,
        lessons: (unit.learning_lessons ?? [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((lesson: any) => ({
            ...lesson,
            progress: progressMap.get(lesson.id),
          })),
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudyModeProgress() {
  return useQuery({
    queryKey: ["study-mode-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_path, default_jlpt_level")
        .eq("id", user.id)
        .single();

      const path = profile?.current_path ?? "jlpt_academic";
      const level = path === "jlpt_academic"
        ? (profile?.default_jlpt_level ?? "n5")
        : "a2";

      const { data: units } = await supabase
        .from("learning_units" as any)
        .select("*, learning_lessons(id)")
        .eq("path", path)
        .eq("level", level);

      const unit = units?.[0];
      if (!unit) return [];

      const lessonIds = (unit.learning_lessons ?? []).map((l: any) => l.id);
      const totalItems = lessonIds.length;

      const { count: completedItems } = await supabase
        .from("user_lesson_progress" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .in("lesson_id", lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);

      const completed = completedItems ?? 0;
      const progress = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

      return [{
        mode: path === "jlpt_academic" ? "jlpt" as const : "jft" as const,
        level: level.toUpperCase(),
        title: unit.title,
        description: unit.description ?? "",
        progress,
        totalItems,
        completedItems: completed,
        unitId: unit.id,
      }];
    },
    staleTime: 60 * 1000,
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, score, xpReward }: { lessonId: string; score?: number; xpReward?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_lesson_progress" as any).upsert({
        user_id: user.id,
        lesson_id: lessonId,
        status: "completed",
        score: score ?? 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });

      return xpReward ?? 25;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-path"] });
      qc.invalidateQueries({ queryKey: ["study-mode-progress"] });
      qc.invalidateQueries({ queryKey: ["daily-missions"] });
    },
  });
}

export function useFirstLesson() {
  return useQuery({
    queryKey: ["first-lesson"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_path, default_jlpt_level")
        .eq("id", user.id)
        .single();

      const path = profile?.current_path ?? "jlpt_academic";
      const level = path === "jlpt_academic" ? (profile?.default_jlpt_level ?? "n5") : "a2";

      const { data: units } = await supabase
        .from("learning_units" as any)
        .select("*, learning_lessons(*)")
        .eq("path", path)
        .eq("level", level)
        .order("order_index")
        .limit(1);

      const lessons = (units?.[0]?.learning_lessons ?? []).sort(
        (a: any, b: any) => a.order_index - b.order_index
      );
      return lessons[0] ?? null;
    },
  });
}
