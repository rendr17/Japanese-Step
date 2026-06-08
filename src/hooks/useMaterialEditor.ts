import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MaterialMeta } from "@/components/editor/MetadataSidebar";
import type { JSONContent } from "@tiptap/react";

const DEFAULT_META: MaterialMeta = {
  title: "",
  category: "grammar",
  level: "n5",
  tags: [],
  is_favorite: false,
};

export function useMaterialEditor(id?: string) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === "new";

  const [meta, setMeta] = useState<MaterialMeta>(DEFAULT_META);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval>>();

  // Load existing material
  const { data: existing, isLoading } = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setMeta({
        title: existing.title,
        category: existing.category,
        level: existing.level,
        tags: existing.tags ?? [],
        is_favorite: existing.is_favorite,
      });
      setContent(existing.content as JSONContent | null);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (params: { meta: MaterialMeta; content: JSONContent | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        title: params.meta.title || "Untitled",
        category: params.meta.category,
        level: params.meta.level,
        tags: params.meta.tags,
        is_favorite: params.meta.is_favorite,
        content: params.content as any,
        user_id: user.id,
      };

      if (isNew) {
        const { data, error } = await supabase.from("materials").insert(payload).select("id").single();
        if (error) throw error;
        return data.id as string;
      } else {
        const { error } = await supabase.from("materials").update(payload).eq("id", id!);
        if (error) throw error;
        return id!;
      }
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      setIsDirty(false);
      toast.success("Materi berhasil disimpan");
      if (isNew) {
        navigate(`/materials/${newId}/edit`, { replace: true });
      }
    },
    onError: () => toast.error("Gagal menyimpan materi"),
  });

  const save = useCallback(() => {
    saveMutation.mutate({ meta, content });
  }, [meta, content, saveMutation]);

  // Auto-save every 10 seconds for existing materials only (new materials need manual first save)
  useEffect(() => {
    if (isNew) return;
    autoSaveTimer.current = setInterval(() => {
      if (isDirty && meta.title) {
        saveMutation.mutate({ meta, content });
      }
    }, 10_000);
    return () => clearInterval(autoSaveTimer.current);
  }, [isNew, isDirty, meta, content, saveMutation]);

  const updateMeta = useCallback((m: MaterialMeta) => {
    setMeta(m);
    setIsDirty(true);
  }, []);

  const updateContent = useCallback((c: JSONContent) => {
    setContent(c);
    setIsDirty(true);
  }, []);

  return {
    meta,
    content,
    vocabulary: (existing?.vocabulary as Array<{ kanji?: string; kana: string }> | null) ?? null,
    isLoading: !isNew && isLoading,
    isDirty,
    isSaving: saveMutation.isPending,
    save,
    updateMeta,
    updateContent,
    isNew,
  };
}
