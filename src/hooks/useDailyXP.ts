import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTodayXP() {
  return useQuery({
    queryKey: ["today-xp"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_xp_logs" as any)
        .select("xp_earned")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      return (data as any)?.xp_earned ?? 0;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useWeeklyStudyMinutes() {
  return useQuery({
    queryKey: ["weekly-study-minutes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await supabase
        .from("study_sessions" as any)
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", weekAgo.toISOString())
        .not("ended_at", "is", null);
      const total = (data as any[] ?? []).reduce((sum: number, s: any) => sum + (s.duration_seconds ?? 0), 0);
      return Math.round(total / 60);
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddXP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ xp, activityType }: { xp: number; activityType: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      // Upsert - add XP to today's total
      const { data: existing } = await supabase
        .from("daily_xp_logs" as any)
        .select("xp_earned")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      
      const newTotal = ((existing as any)?.xp_earned ?? 0) + xp;
      await supabase
        .from("daily_xp_logs" as any)
        .upsert(
          { user_id: user.id, date: today, xp_earned: newTotal, activity_type: activityType },
          { onConflict: "user_id,date" }
        );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today-xp"] });
    },
  });
}
