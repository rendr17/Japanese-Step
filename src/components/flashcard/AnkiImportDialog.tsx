import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

interface ParsedCard {
  front: string;
  back: string;
  tags?: string[];
}

interface AnkiImportDialogProps {
  onImportComplete?: () => void;
}

function parseAnkiText(text: string): ParsedCard[] {
  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const cards: ParsedCard[] = [];

  for (const line of lines) {
    // Try tab-separated first (Anki default export)
    let parts = line.split("\t");
    if (parts.length < 2) {
      // Try semicolon (Anki alt separator)
      parts = line.split(";");
    }
    if (parts.length < 2) {
      // Try comma, but be careful with content containing commas
      const match = line.match(/^"?([^",]+)"?\s*,\s*"?([^"]+)"?(?:\s*,\s*"?([^"]*)"?)?$/);
      if (match) {
        parts = [match[1], match[2], match[3] ?? ""];
      }
    }
    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/<[^>]*>/g, ""); // Strip HTML
      const back = parts[1].trim().replace(/<[^>]*>/g, "");
      const tags = parts[2]?.trim().split(/\s+/).filter(Boolean) ?? [];
      if (front && back) {
        cards.push({ front, back, tags });
      }
    }
  }
  return cards;
}

function inferKanjiKana(front: string): { kanji: string | null; kana: string } {
  // Check if front contains kanji (CJK Unified Ideographs range)
  const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(front);
  if (hasKanji) {
    // Try to extract kana reading from brackets/parentheses
    const readingMatch = front.match(/[（(]([ぁ-ゖァ-ヶー]+)[）)]/);
    if (readingMatch) {
      const kanji = front.replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/, "").trim();
      return { kanji, kana: readingMatch[1] };
    }
    return { kanji: front, kana: front };
  }
  // Pure kana
  return { kanji: null, kana: front };
}

const AnkiImportDialog = ({ onImportComplete }: AnkiImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [jlptLevel, setJlptLevel] = useState<Enums<"jlpt_level">>("n5");
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const cards = parseAnkiText(text);
      setParsedCards(cards);
      setStep(cards.length > 0 ? "preview" : "upload");
      if (cards.length === 0) {
        toast.error("Tidak ada kartu yang dapat diparsing dari file ini");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const batchSize = 20;
      let imported = 0;

      for (let i = 0; i < parsedCards.length; i += batchSize) {
        const batch = parsedCards.slice(i, i + batchSize);
        const rows = batch.map((card) => {
          const { kanji, kana } = inferKanjiKana(card.front);
          return {
            user_id: user.id,
            kanji,
            kana,
            meaning: card.back,
            jlpt_level: jlptLevel,
            tags: card.tags?.length ? card.tags : ["anki-import"],
          };
        });

        const { data: insertedVocab, error: vocabError } = await supabase
          .from("vocab_bank")
          .insert(rows)
          .select("id");

        if (vocabError) throw vocabError;

        // Create SRS entries for imported vocab
        if (insertedVocab) {
          const srsRows = insertedVocab.map((v) => ({
            user_id: user.id,
            vocab_id: v.id,
            next_review_date: new Date().toISOString(),
          }));

          const { error: srsError } = await supabase.from("srs_logs").insert(srsRows);
          if (srsError) console.error("SRS insert error:", srsError);
        }

        imported += batch.length;
        setImportProgress(Math.round((imported / parsedCards.length) * 100));
      }

      setImportedCount(imported);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["flashcard-due-cards"] });
      qc.invalidateQueries({ queryKey: ["vocabulary-simple"] });
      toast.success(`${imported} kartu berhasil diimport!`);
      onImportComplete?.();
    } catch (err: any) {
      toast.error("Import gagal: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setParsedCards([]);
    setFileName("");
    setStep("upload");
    setImportProgress(0);
    setImportedCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload size={16} /> Import Anki
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Import dari Anki</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <FileText className="mx-auto text-muted-foreground mb-3" size={40} />
                <p className="text-sm font-medium text-foreground">
                  Drop file di sini atau klik untuk upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: .txt, .csv (tab/semicolon/comma separated)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format Anki: Front → Back (per baris)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.tsv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">Format yang didukung:</p>
                <p className="text-xs text-muted-foreground">• Tab-separated: <code>漢字{"\t"}meaning</code></p>
                <p className="text-xs text-muted-foreground">• Semicolon: <code>漢字;meaning</code></p>
                <p className="text-xs text-muted-foreground">• CSV: <code>漢字,meaning,tags</code></p>
                <p className="text-xs text-muted-foreground">• Export dari Anki → File → Export → "Notes in Plain Text"</p>
              </div>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                </div>
                <Badge variant="secondary">{parsedCards.length} kartu</Badge>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Level JLPT</Label>
                <Select value={jlptLevel} onValueChange={(v) => setJlptLevel(v as Enums<"jlpt_level">)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["n5", "n4", "n3", "n2", "n1"].map((l) => (
                      <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview cards */}
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border">
                {parsedCards.slice(0, 50).map((card, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm even:bg-muted/50">
                    <span className="font-jp text-foreground truncate flex-1">{card.front}</span>
                    <span className="text-muted-foreground truncate flex-1 text-right">{card.back}</span>
                  </div>
                ))}
                {parsedCards.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ...dan {parsedCards.length - 50} kartu lainnya
                  </p>
                )}
              </div>

              {importing && (
                <div className="space-y-1">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{importProgress}%</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset} disabled={importing}>
                  Kembali
                </Button>
                <Button className="flex-1 gap-2" onClick={handleImport} disabled={importing}>
                  {importing ? "Mengimport..." : `Import ${parsedCards.length} Kartu`}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <CheckCircle2 className="mx-auto text-secondary" size={48} />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Import Berhasil!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {importedCount} kartu telah ditambahkan ke vocab bank dan siap untuk direview.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Import Lagi
                </Button>
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  Mulai Review
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AnkiImportDialog;
