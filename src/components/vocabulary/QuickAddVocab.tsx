import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Sparkles, Mic, MicOff, Save, X, Loader2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAddVocab, useAddToSrs, type VocabRow } from "@/hooks/useVocabulary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Kana validation ────────────────────────────────────────────────
const isKana = (str: string) => /^[\u3040-\u309F\u30A0-\u30FF\u30FC\u3000-\u303Fー\s]+$/.test(str.trim());

// ── Types ──────────────────────────────────────────────────────────
interface QuickAddVocabProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editVocab?: VocabRow | null;
  existingTags?: string[];
}

interface FormData {
  kanji: string;
  kana: string;
  meaning: string;
  example_sentence: string;
  jlpt_level: string;
  tags: string[];
}

const emptyForm: FormData = {
  kanji: "", kana: "", meaning: "", example_sentence: "", jlpt_level: "n5", tags: [],
};

// ── Tag Input Component ────────────────────────────────────────────
const TagInput = ({
  tags, onChange, suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1 mb-1">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => removeTag(t)}>
            #{t} <X size={10} />
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) { e.preventDefault(); addTag(input); }
            if (e.key === "Backspace" && !input && tags.length) removeTag(tags[tags.length - 1]);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Ketik tag, enter untuk tambah..."
          className="text-xs h-8"
        />
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && input && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-32 overflow-y-auto"
            >
              {filtered.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                >
                  #{s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Form Content ───────────────────────────────────────────────────
const FormContent = ({
  form, setForm, existingTags, onSave, onSaveAndAdd, onSaveAndReview, isPending, editVocab,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  existingTags: string[];
  onSave: () => void;
  onSaveAndAdd: () => void;
  onSaveAndReview: () => void;
  isPending: boolean;
  editVocab?: VocabRow | null;
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const kanjiRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // AI Fill
  const handleAiFill = async () => {
    if (!form.kanji.trim()) {
      toast.error("Masukkan Kanji terlebih dahulu");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vocab-ai-fill", {
        body: { kanji: form.kanji.trim() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setForm((p) => ({
        ...p,
        kana: data.kana || p.kana,
        meaning: data.meaning || p.meaning,
        example_sentence: data.example_sentence || p.example_sentence,
      }));
      toast.success("AI berhasil mengisi data!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengisi dengan AI");
    } finally {
      setAiLoading(false);
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Tidak bisa mengakses mikrofon");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  // Expose audioBlob for parent save handlers via a ref-like pattern on form
  useEffect(() => {
    (form as any)._audioBlob = audioBlob;
  }, [audioBlob]);

  return (
    <div className="space-y-4 py-2">
      {/* Kanji + AI button */}
      <div>
        <Label className="text-xs text-muted-foreground">Kanji</Label>
        <div className="flex gap-2">
          <Input
            ref={kanjiRef}
            value={form.kanji}
            onChange={(e) => set("kanji", e.target.value)}
            placeholder="漢字"
            className="font-jp text-lg h-11 flex-1"
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 gap-1.5 text-xs shrink-0"
            onClick={handleAiFill}
            disabled={aiLoading || !form.kanji.trim()}
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Fill with AI
          </Button>
        </div>
      </div>

      {/* Kana */}
      <div>
        <Label className="text-xs text-muted-foreground">Kana *</Label>
        <Input
          value={form.kana}
          onChange={(e) => set("kana", e.target.value)}
          placeholder="かんじ"
          className="font-jp text-lg h-11"
        />
      </div>

      {/* Meaning */}
      <div>
        <Label className="text-xs text-muted-foreground">Meaning *</Label>
        <Textarea
          value={form.meaning}
          onChange={(e) => set("meaning", e.target.value)}
          placeholder="Tulisan China / huruf kanji"
          className="min-h-[60px] text-sm"
        />
      </div>

      {/* Example sentence */}
      <div>
        <Label className="text-xs text-muted-foreground">Contoh Kalimat</Label>
        <Input
          value={form.example_sentence}
          onChange={(e) => set("example_sentence", e.target.value)}
          placeholder="漢字を書く練習をする"
          className="font-jp"
        />
      </div>

      {/* Level + Tags */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">JLPT Level</Label>
          <Select value={form.jlpt_level} onValueChange={(v) => set("jlpt_level", v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["n5", "n4", "n3", "n2", "n1"].map((l) => (
                <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <TagInput tags={form.tags} onChange={(t) => set("tags", t)} suggestions={existingTags} />
        </div>
      </div>

      {/* Audio recording */}
      <div>
        <Label className="text-xs text-muted-foreground">Pronunciation</Label>
        <div className="flex items-center gap-2 mt-1">
          {isRecording ? (
            <Button type="button" variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={stopRecording}>
              <MicOff size={14} /> Stop
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={startRecording}>
              <Mic size={14} /> Rekam
            </Button>
          )}
          {isRecording && (
            <motion.div className="flex gap-0.5" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-4 rounded-full bg-destructive" />
              ))}
            </motion.div>
          )}
          {audioUrl && !isRecording && (
            <div className="flex items-center gap-2 flex-1">
              <audio src={audioUrl} controls className="h-8 flex-1" />
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAudio}>
                <RotateCcw size={12} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
        <Button onClick={onSaveAndAdd} variant="outline" disabled={isPending} className="flex-1 gap-1.5 text-xs">
          <Save size={14} /> Save & Add Another
        </Button>
        <Button onClick={onSaveAndReview} variant="outline" disabled={isPending} className="flex-1 gap-1.5 text-xs">
          <Plus size={14} /> Save & Review
        </Button>
        <Button onClick={onSave} disabled={isPending} className="flex-1 gap-1.5 text-xs">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {editVocab ? "Simpan" : "Save & Close"}
        </Button>
      </div>
    </div>
  );
};

// ── Main QuickAddVocab Component ───────────────────────────────────
const QuickAddVocab = ({ open, onOpenChange, editVocab, existingTags = [] }: QuickAddVocabProps) => {
  const isMobile = useIsMobile();
  const addMut = useAddVocab();
  const addToSrsMut = useAddToSrs();
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    if (editVocab) {
      setForm({
        kanji: editVocab.kanji ?? "",
        kana: editVocab.kana,
        meaning: editVocab.meaning,
        example_sentence: editVocab.example_sentence ?? "",
        jlpt_level: editVocab.jlpt_level ?? "n5",
        tags: editVocab.tags ?? [],
      });
    } else if (open) {
      setForm(emptyForm);
    }
  }, [editVocab, open]);

  const validate = (): boolean => {
    if (!form.kana.trim()) {
      toast.error("Kana wajib diisi");
      return false;
    }
    if (!isKana(form.kana)) {
      toast.error("Kana harus berupa Hiragana atau Katakana");
      return false;
    }
    if (!form.meaning.trim()) {
      toast.error("Meaning wajib diisi");
      return false;
    }
    return true;
  };

  const uploadAudio = async (): Promise<string | null> => {
    const blob = (form as any)._audioBlob as Blob | null;
    if (!blob) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileName = `${user.id}/${Date.now()}.webm`;
    const { error } = await supabase.storage.from("vocab-audio").upload(fileName, blob, {
      contentType: "audio/webm",
    });
    if (error) {
      console.error("Audio upload error:", error);
      toast.error("Gagal upload audio");
      return null;
    }
    const { data: urlData } = supabase.storage.from("vocab-audio").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const doSave = async (): Promise<string | null> => {
    if (!validate()) return null;

    const audioUrl = await uploadAudio();
    const payload = {
      kanji: form.kanji || null,
      kana: form.kana,
      meaning: form.meaning,
      example_sentence: form.example_sentence || null,
      jlpt_level: form.jlpt_level as any,
      tags: form.tags.length > 0 ? form.tags : null,
      audio_url: audioUrl,
    };

    return new Promise((resolve) => {
      addMut.mutate(payload, {
        onSuccess: () => resolve("ok"),
        onError: (e) => { toast.error("Gagal menyimpan"); resolve(null); },
      });
    });
  };

  const handleSave = async () => {
    const ok = await doSave();
    if (ok) {
      toast.success("Kosakata ditambahkan");
      onOpenChange(false);
    }
  };

  const handleSaveAndAdd = async () => {
    const ok = await doSave();
    if (ok) {
      toast.success("Kosakata ditambahkan, tambah lagi!");
      setForm(emptyForm);
    }
  };

  const handleSaveAndReview = async () => {
    const ok = await doSave();
    if (ok) {
      toast.success("Kosakata ditambahkan ke SRS");
      onOpenChange(false);
      // Note: navigating to flashcards would go here when the route exists
    }
  };

  const formProps = {
    form,
    setForm,
    existingTags,
    onSave: handleSave,
    onSaveAndAdd: handleSaveAndAdd,
    onSaveAndReview: handleSaveAndReview,
    isPending: addMut.isPending,
    editVocab,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="font-serif">
              {editVocab ? "Edit Kosakata" : "Tambah Kosakata"}
            </DrawerTitle>
            <DrawerDescription>
              {editVocab ? "Perbarui detail kosakata" : "Tambahkan kosakata baru ke bank kamu"}
            </DrawerDescription>
          </DrawerHeader>
          <FormContent {...formProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editVocab ? "Edit Kosakata" : "Tambah Kosakata"}
          </DialogTitle>
          <DialogDescription>
            {editVocab ? "Perbarui detail kosakata" : "Tambahkan kosakata baru ke bank kamu"}
          </DialogDescription>
        </DialogHeader>
        <FormContent {...formProps} />
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddVocab;
