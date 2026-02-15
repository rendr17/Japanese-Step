import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type VocabRow = Tables<"vocab_bank">;
export type VocabInsert = TablesInsert<"vocab_bank">;
export type VocabUpdate = TablesUpdate<"vocab_bank">;
export type SrsStatus = "new" | "learning" | "review" | "mastered";

interface VocabFilters {
  level: string;
  status: string;
  search: string;
  sort: "kana_az" | "newest" | "most_reviewed";
}

const PAGE_SIZE = 30;

export function useVocabulary(filters: VocabFilters) {
  return useInfiniteQuery({
    queryKey: ["vocabulary", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("vocab_bank")
        .select("*, srs_logs!inner(status, repetitions)", { count: "exact" })
        .eq("user_id", user.id)
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters.level !== "all") {
        query = query.eq("jlpt_level", filters.level as "n5" | "n4" | "n3" | "n2" | "n1" | "none");
      }
      if (filters.search) {
        query = query.or(
          `kanji.ilike.%${filters.search}%,kana.ilike.%${filters.search}%,meaning.ilike.%${filters.search}%`
        );
      }

      // Sort
      if (filters.sort === "kana_az") {
        query = query.order("kana", { ascending: true });
      } else if (filters.sort === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // If no srs_logs join, also fetch without inner join
      return { data: data ?? [], count: count ?? 0, page: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (last) => {
      if (last.data.length < PAGE_SIZE) return undefined;
      return last.page + 1;
    },
  });
}

// Simpler query without SRS join for reliability
export function useVocabularySimple(filters: VocabFilters) {
  return useInfiniteQuery({
    queryKey: ["vocabulary-simple", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("vocab_bank")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters.level !== "all") {
        query = query.eq("jlpt_level", filters.level as "n5" | "n4" | "n3" | "n2" | "n1" | "none");
      }
      if (filters.search) {
        query = query.or(
          `kanji.ilike.%${filters.search}%,kana.ilike.%${filters.search}%,meaning.ilike.%${filters.search}%`
        );
      }
      if (filters.sort === "kana_az") {
        query = query.order("kana", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0, page: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (last) => {
      if (last.data.length < PAGE_SIZE) return undefined;
      return last.page + 1;
    },
  });
}

export function useVocabSrsStatus() {
  return useInfiniteQuery({
    queryKey: ["vocab-srs-statuses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: {} as Record<string, SrsStatus>, page: 0 };

      const { data } = await supabase
        .from("srs_logs")
        .select("vocab_id, status")
        .eq("user_id", user.id);

      const map: Record<string, SrsStatus> = {};
      (data ?? []).forEach((r) => { map[r.vocab_id] = r.status as SrsStatus; });
      return { data: map, page: 0 };
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
  });
}

export function useAddVocab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vocab: Omit<VocabInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("vocab_bank").insert({ ...vocab, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vocabulary-simple"] }),
  });
}

export function useUpdateVocab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: VocabUpdate & { id: string }) => {
      const { error } = await supabase.from("vocab_bank").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vocabulary-simple"] }),
  });
}

export function useDeleteVocab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vocab_bank").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vocabulary-simple"] }),
  });
}

export function useBulkDeleteVocab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("vocab_bank").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vocabulary-simple"] }),
  });
}

export function useAddToSrs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vocabId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if already exists
      const { data: existing } = await supabase
        .from("srs_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("vocab_id", vocabId)
        .maybeSingle();

      if (existing) return; // Already in SRS

      const { error } = await supabase.from("srs_logs").insert({
        user_id: user.id,
        vocab_id: vocabId,
        next_review_date: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocab-srs-statuses"] });
    },
  });
}
