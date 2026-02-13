import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVocabStats() {
  return useQuery({
    queryKey: ["vocab-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, mastered: 0 };

      const { count: total } = await supabase
        .from("vocab_bank")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: mastered } = await supabase
        .from("srs_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "mastered");

      return { total: total ?? 0, mastered: mastered ?? 0 };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useDueReviews() {
  return useQuery({
    queryKey: ["due-reviews"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("srs_logs")
        .select("*, vocab_bank(*)")
        .eq("user_id", user.id)
        .lte("next_review_date", now)
        .neq("status", "mastered")
        .order("next_review_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useRecentMaterials() {
  return useQuery({
    queryKey: ["recent-materials"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
