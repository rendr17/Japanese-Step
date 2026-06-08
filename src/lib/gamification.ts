import { supabase } from "@/integrations/supabase/client";

export async function addDailyXP(userId: string, xp: number, activityType: string) {
  if (xp <= 0) return;

  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("daily_xp_logs" as any)
    .select("xp_earned")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const newTotal = ((existing as any)?.xp_earned ?? 0) + xp;
  await supabase
    .from("daily_xp_logs" as any)
    .upsert(
      { user_id: userId, date: today, xp_earned: newTotal, activity_type: activityType },
      { onConflict: "user_id,date" }
    );

  await supabase.rpc("update_user_streak" as any, { p_user_id: userId });
}

export async function checkAndAwardAchievements(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak")
    .eq("id", userId)
    .single();

  const { count: masteredCount } = await supabase
    .from("srs_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "mastered");

  const { count: lessonsCompleted } = await supabase
    .from("user_lesson_progress" as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { data: examResults } = await supabase
    .from("exam_results")
    .select("score, total_questions")
    .eq("user_id", userId);

  const hasExamPass = (examResults ?? []).some(
    (r) => r.total_questions > 0 && r.score / r.total_questions >= 0.75
  );

  const { data: achievements } = await supabase
    .from("achievements" as any)
    .select("*");

  const { data: earned } = await supabase
    .from("user_achievements" as any)
    .select("achievement_id")
    .eq("user_id", userId);

  const earnedIds = new Set((earned ?? []).map((e: any) => e.achievement_id));

  for (const ach of achievements ?? []) {
    if (earnedIds.has(ach.id)) continue;
    const criteria = ach.criteria as Record<string, number>;
    let qualifies = false;

    if (criteria.streak && (profile?.current_streak ?? 0) >= criteria.streak) qualifies = true;
    if (criteria.vocab_mastered && (masteredCount ?? 0) >= criteria.vocab_mastered) qualifies = true;
    if (criteria.lessons_completed && (lessonsCompleted ?? 0) >= criteria.lessons_completed) qualifies = true;
    if (criteria.exam_score_pct && hasExamPass) qualifies = true;

    if (qualifies) {
      await supabase.from("user_achievements" as any).insert({
        user_id: userId,
        achievement_id: ach.id,
      });
      if (ach.xp_reward > 0) {
        await addDailyXP(userId, ach.xp_reward, "achievement");
      }
    }
  }
}
