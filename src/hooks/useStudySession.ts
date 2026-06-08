import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStudySession() {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const activityTypeRef = useRef<string>("study");

  const startSession = useCallback(async (activityType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    activityTypeRef.current = activityType;
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

    sessionIdRef.current = null;
    startTimeRef.current = null;
  }, []);

  return { startSession, endSession };
}
