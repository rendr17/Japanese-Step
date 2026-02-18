import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ExamQuestion {
  id: string;
  exam_type: string;
  level: string;
  section: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty: number;
  tags?: string[];
  is_active: boolean;
  audio_prompt?: string;
  image_prompt?: string;
  transcript?: string;
  created_at: string;
}

export interface QuestionFormData {
  exam_type: string;
  level: string;
  section: string;
  question_text: string;
  options: [string, string, string, string];
  correct_answer: number;
  explanation?: string;
  difficulty: number;
  tags?: string[];
  audio_prompt?: string;
  image_prompt?: string;
  transcript?: string;
}

interface Filters {
  exam_type: string;
  level: string;
  section: string;
  is_active: string;
  search: string;
}

export function useAdminQuestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    exam_type: "all",
    level: "all",
    section: "all",
    is_active: "all",
    search: "",
  });

  const isAdminQuery = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const questionsQuery = useQuery({
    queryKey: ["admin-questions", filters],
    queryFn: async () => {
      // Build query without chaining to avoid TS2589
      const baseQuery: Record<string, any> = {};
      if (filters.exam_type !== "all") baseQuery.exam_type = filters.exam_type;
      if (filters.level !== "all") baseQuery.level = filters.level;
      if (filters.section !== "all") baseQuery.section = filters.section;
      if (filters.is_active !== "all") baseQuery.is_active = filters.is_active === "true";

      let q = supabase.from("exam_questions").select("*") as any;
      for (const [key, val] of Object.entries(baseQuery)) {
        q = q.eq(key, val);
      }
      if (filters.search) q = q.ilike("question_text", `%${filters.search}%`);
      q = q.order("created_at", { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ExamQuestion[];
    },
    enabled: isAdminQuery.data === true,
  });

  const createMutation = useMutation({
    mutationFn: async (form: QuestionFormData) => {
      const { error } = await supabase.from("exam_questions").insert({
        exam_type: form.exam_type,
        level: form.level,
        section: form.section,
        question_text: form.question_text,
        options: form.options as any,
        correct_answer: form.correct_answer,
        explanation: form.explanation || null,
        difficulty: form.difficulty,
        tags: form.tags || null,
        audio_prompt: form.audio_prompt || null,
        image_prompt: form.image_prompt || null,
        transcript: form.transcript || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Soal berhasil ditambahkan" });
    },
    onError: (e: any) => toast({ title: "Gagal menambahkan soal", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...form }: QuestionFormData & { id: string }) => {
      const { error } = await supabase
        .from("exam_questions")
        .update({
          exam_type: form.exam_type,
          level: form.level,
          section: form.section,
          question_text: form.question_text,
          options: form.options as any,
          correct_answer: form.correct_answer,
          explanation: form.explanation || null,
          difficulty: form.difficulty,
          tags: form.tags || null,
          audio_prompt: form.audio_prompt || null,
          image_prompt: form.image_prompt || null,
          transcript: form.transcript || null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Soal berhasil diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal memperbarui soal", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("exam_questions")
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Status soal diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal mengubah status", description: e.message, variant: "destructive" }),
  });

  return {
    isAdmin: isAdminQuery.data === true,
    isAdminLoading: isAdminQuery.isLoading,
    questions: questionsQuery.data || [],
    isLoading: questionsQuery.isLoading,
    filters,
    setFilters,
    createQuestion: createMutation.mutateAsync,
    updateQuestion: updateMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
