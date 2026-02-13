import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

const PAGE_SIZE = 12;

export type MaterialRow = Tables<"materials">;
export type MaterialCategory = "grammar" | "reading" | "conversation" | "vocabulary";

interface MaterialsFilters {
  category?: MaterialCategory | "all";
  level?: Enums<"jlpt_level"> | "all";
  sort?: "newest" | "oldest" | "az" | "favorites";
  search?: string;
  tags?: string[];
}

export function useMaterials(filters: MaterialsFilters) {
  return useInfiniteQuery({
    queryKey: ["materials", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], nextPage: null };

      let query = supabase
        .from("materials")
        .select("*")
        .eq("user_id", user.id);

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.level && filters.level !== "all") {
        query = query.eq("level", filters.level);
      }
      if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags);
      }

      switch (filters.sort) {
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "az":
          query = query.order("title", { ascending: true });
          break;
        case "favorites":
          query = query.order("is_favorite", { ascending: false }).order("updated_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      query = query.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: data ?? [],
        nextPage: (data?.length ?? 0) === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 60 * 1000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("materials")
        .update({ is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useDuplicateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: MaterialRow) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { id, created_at, updated_at, ...rest } = material;
      const { error } = await supabase.from("materials").insert({
        ...rest,
        title: `${rest.title} (Copy)`,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}
