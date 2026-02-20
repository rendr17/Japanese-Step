import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSrsDueCount() {
  return useQuery({
    queryKey: ["srs-due-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const now = new Date().toISOString();
      const { count } = await supabase
        .from("srs_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_date", now)
        .neq("status", "mastered");
      return count ?? 0;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
