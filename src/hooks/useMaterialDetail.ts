import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MaterialRow = Tables<"materials">;

export function useMaterialDetail(id?: string) {
  return useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useRelatedMaterials(material?: MaterialRow | null) {
  return useQuery({
    queryKey: ["related-materials", material?.id],
    queryFn: async () => {
      if (!material) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("materials")
        .select("*")
        .eq("user_id", user.id)
        .neq("id", material.id)
        .limit(6);

      // Prefer same tags
      if (material.tags && material.tags.length > 0) {
        query = query.overlaps("tags", material.tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If not enough from tag overlap, fetch by category
      if ((data?.length ?? 0) < 6) {
        const ids = (data ?? []).map((d) => d.id);
        const { data: extra } = await supabase
          .from("materials")
          .select("*")
          .eq("user_id", user.id)
          .eq("category", material.category)
          .not("id", "in", `(${[material.id, ...ids].join(",")})`)
          .limit(6 - (data?.length ?? 0));
        return [...(data ?? []), ...(extra ?? [])].slice(0, 6);
      }
      return data ?? [];
    },
    enabled: !!material?.id,
    staleTime: 60_000,
  });
}
