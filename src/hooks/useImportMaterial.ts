import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface ImportSection {
  title: string;
  content_html: string;
  section_type: string;
  selected: boolean;
  category: "grammar" | "reading" | "conversation" | "vocabulary";
  tags: string[];
}

export interface ImportVocab {
  kanji?: string;
  kana: string;
  meaning: string;
  level?: string;
  selected: boolean;
}

export interface ImportAnalysis {
  suggested_title: string;
  summary: string[];
  sections: ImportSection[];
  vocabulary: ImportVocab[];
  grammar_notes: { pattern: string; explanation: string }[];
  cultural_note?: string;
  indonesian_translation?: string;
  detected_level: string;
  suggested_category: string;
  suggested_tags: string[];
}

export interface ImportSettings {
  sourceType: "upload" | "paste";
  sourceCategory: "textbook" | "article" | "dialogue" | "notes";
  template: string;
  language: "indonesian" | "english";
  targetPath: "jlpt" | "jft";
  level: string;
  fileName: string;
  saveFullContent: boolean;
  splitMode: "single" | "chapter" | "subtitle" | "length";
}

export function useImportMaterial() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [settings, setSettings] = useState<ImportSettings>({
    sourceType: "paste",
    sourceCategory: "textbook",
    template: "",
    language: "indonesian",
    targetPath: "jlpt",
    level: "",
    fileName: "Pasted text",
    saveFullContent: false,
    splitMode: "single",
  });
  const [savedMaterialIds, setSavedMaterialIds] = useState<string[]>([]);
  const [savedVocabCount, setSavedVocabCount] = useState(0);

  const analyze = async () => {
    if (!rawText.trim()) {
      toast.error("Masukkan teks terlebih dahulu");
      return;
    }
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-material", {
        body: {
          text: rawText,
          source_category: settings.sourceCategory,
          template: settings.template || undefined,
          language: settings.language,
          level: settings.level || undefined,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const sections: ImportSection[] = (data.sections || []).map((s: any) => ({
        ...s,
        selected: true,
        category: data.suggested_category || "reading",
        tags: data.suggested_tags || [],
      }));
      const vocabulary: ImportVocab[] = (data.vocabulary || []).map((v: any) => ({
        ...v,
        selected: true,
      }));

      setAnalysis({
        ...data,
        sections,
        vocabulary,
      });
      setStep(2);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Gagal menganalisis teks");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMaterials = async () => {
    if (!analysis) return;
    setIsSaving(true);
    setSaveProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedSections = analysis.sections.filter((s) => s.selected);
      if (selectedSections.length === 0) {
        toast.error("Pilih minimal 1 bagian untuk disimpan");
        setIsSaving(false);
        return;
      }

      // Create import history
      const { data: importHistory, error: histError } = await supabase
        .from("import_history" as any)
        .insert({
          user_id: user.id,
          file_name: settings.fileName,
          source_type: settings.sourceType,
          source_category: settings.sourceCategory,
          template: settings.template || null,
          total_materials: selectedSections.length,
          total_vocab: analysis.vocabulary.filter((v) => v.selected).length,
          settings: settings as any,
        })
        .select("id")
        .single();
      if (histError) throw histError;

      const importId = (importHistory as any).id;
      const materialIds: string[] = [];

      for (let i = 0; i < selectedSections.length; i++) {
        const section = selectedSections[i];
        const levelVal = (analysis.detected_level || settings.level || "n5").toLowerCase();
        const validLevels = ["n5", "n4", "n3", "n2", "n1", "none"];
        const finalLevel = validLevels.includes(levelVal) ? levelVal : "n5";

        const { data: mat, error: matErr } = await supabase
          .from("materials")
          .insert({
            user_id: user.id,
            title: selectedSections.length === 1 ? analysis.suggested_title : section.title,
            category: section.category,
            level: finalLevel as any,
            tags: section.tags,
            content: settings.saveFullContent
              ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: section.content_html }] }] }
              : { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: analysis.summary.join("\n") }] }] },
            vocabulary: analysis.vocabulary.filter((v) => v.selected).map((v) => ({ kanji: v.kanji || "", kana: v.kana, meaning: v.meaning })),
            grammar_notes: analysis.grammar_notes,
            cultural_note: analysis.cultural_note || null,
            indonesian_translation: analysis.indonesian_translation || null,
            source_import_id: importId,
          } as any)
          .select("id")
          .single();

        if (matErr) throw matErr;
        materialIds.push((mat as any).id);
        setSaveProgress(Math.round(((i + 1) / selectedSections.length) * 100));
      }

      setSavedMaterialIds(materialIds);

      // Save selected vocab
      const selectedVocab = analysis.vocabulary.filter((v) => v.selected);
      if (selectedVocab.length > 0) {
        const vocabRows = selectedVocab.map((v) => ({
          user_id: user.id,
          kanji: v.kanji || null,
          kana: v.kana,
          meaning: v.meaning,
          jlpt_level: (["n5","n4","n3","n2","n1","none"].includes(v.level || "") ? v.level : null) as any,
          tags: analysis.suggested_tags?.slice(0, 3) || [],
        }));
        const { error: vocErr } = await supabase.from("vocab_bank").insert(vocabRows);
        if (vocErr) console.error("Vocab save error:", vocErr);
        setSavedVocabCount(selectedVocab.length);
      }

      setStep(5);
      toast.success("Import berhasil!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Gagal menyimpan materi");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    step, setStep,
    isAnalyzing, isSaving, saveProgress,
    rawText, setRawText,
    analysis, setAnalysis,
    settings, setSettings,
    savedMaterialIds, savedVocabCount,
    analyze, saveMaterials,
    navigate,
  };
}
