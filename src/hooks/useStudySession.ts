import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStudySession() {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const startSession = useCallback(async (activityType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    startTimeRef.current = new Date();
    const { data } = await supabase
      .from("study_sessions" as any)
      .insert({ user_id: user.id, activity_type: activityType, started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (data) sessionIdRef.current = (data as any).id;
  }, []);

  const endSession = useCallback(async (xpEarned = 0) => {
    if (!sessionIdRef.current || !startTimeRef.current) return;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current.getTime()) / 1000);

    await supabase
      .from("study_sessions" as any)
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        xp_earned: xpEarned,
      })
      .eq("id", sessionIdRef.current);

    // Update daily XP log
    const { data: { user } } = await supabase.auth.getUser();
    if (user && xpEarned > 0) {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_xp_logs" as any)
        .upsert(
          { user_id: user.id, date: today, xp_earned: xpEarned, activity_type: "flashcard" },
          { onConflict: "user_id,date", ignoreDuplicates: false }
        );
    }

    sessionIdRef.current = null;
    startTimeRef.current = null;
  }, []);

  return { startSession, endSession };
}
