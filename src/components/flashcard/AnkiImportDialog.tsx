import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Package, CheckCircle2, Loader2 } from "lucide-react";
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

// ── Text/CSV parser ──
function parseAnkiText(text: string): ParsedCard[] {
  const lines = text.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const cards: ParsedCard[] = [];
  for (const line of lines) {
    let parts = line.split("\t");
    if (parts.length < 2) parts = line.split(";");
    if (parts.length < 2) {
      const match = line.match(/^"?([^",]+)"?\s*,\s*"?([^"]+)"?(?:\s*,\s*"?([^"]*)"?)?$/);
      if (match) parts = [match[1], match[2], match[3] ?? ""];
    }
    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/<[^>]*>/g, "");
      const back = parts[1].trim().replace(/<[^>]*>/g, "");
      const tags = parts[2]?.trim().split(/\s+/).filter(Boolean) ?? [];
      if (front && back) cards.push({ front, back, tags });
    }
  }
  return cards;
}

// ── .apkg parser (ZIP → SQLite → cards) ──
async function parseApkgFile(file: File): Promise<ParsedCard[]> {
  const [JSZip, initSqlJs] = await Promise.all([
    import("jszip").then((m) => m.default),
    import("sql.js").then((m) => m.default),
  ]);

  const zip = await JSZip.loadAsync(file);

  // Find the SQLite database file inside the .apkg
  let dbFile: Uint8Array | null = null;
  for (const name of ["collection.anki21", "collection.anki2"]) {
    const entry = zip.file(name);
    if (entry) {
      dbFile = await entry.async("uint8array");
      break;
    }
  }

  if (!dbFile) {
    throw new Error("File .apkg tidak valid: database Anki tidak ditemukan");
  }

  // Initialize sql.js with CDN WASM
  const SQL = await initSqlJs({
    locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
  });

  const db = new SQL.Database(dbFile);

  const cards: ParsedCard[] = [];

  try {
    // Anki 2.1+ schema: notes table has flds (fields separated by \x1f)
    const result = db.exec(
      "SELECT flds, tags FROM notes ORDER BY id"
    );

    if (result.length > 0) {
      const rows = result[0].values;
      for (const row of rows) {
        const flds = (row[0] as string).split("\x1f");
        const tagsStr = (row[1] as string || "").trim();

        if (flds.length >= 2) {
          const front = flds[0].replace(/<[^>]*>/g, "").trim();
          const back = flds[1].replace(/<[^>]*>/g, "").trim();
          const tags = tagsStr ? tagsStr.split(/\s+/).filter(Boolean) : [];

          if (front && back) {
            cards.push({ front, back, tags });
          }
        }
      }
    }
  } finally {
    db.close();
  }

  return cards;
}

// ── Kanji/Kana inference ──
function inferKanjiKana(front: string): { kanji: string | null; kana: string } {
  const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(front);
  if (hasKanji) {
    const readingMatch = front.match(/[（(]([ぁ-ゖァ-ヶー]+)[）)]/);
    if (readingMatch) {
      const kanji = front.replace(/[（(][ぁ-ゖァ-ヶー]+[）)]/, "").trim();
      return { kanji, kana: readingMatch[1] };
    }
    return { kanji: front, kana: front };
  }
  return { kanji: null, kana: front };
}

const AnkiImportDialog = ({ onImportComplete }: AnkiImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [jlptLevel, setJlptLevel] = useState<Enums<"jlpt_level">>("n5");
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importedCount, setImportedCount] = useState(0);
  const [fileType, setFileType] = useState<"text" | "apkg">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const isApkg = file.name.endsWith(".apkg") || file.name.endsWith(".colpkg");

    setParsing(true);
    setFileType(isApkg ? "apkg" : "text");

    try {
      let cards: ParsedCard[];

      if (isApkg) {
        cards = await parseApkgFile(file);
      } else {
        const text = await file.text();
        cards = parseAnkiText(text);
      }

      setParsedCards(cards);
      setStep(cards.length > 0 ? "preview" : "upload");

      if (cards.length === 0) {
        toast.error("Tidak ada kartu yang dapat diparsing dari file ini");
      }
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
      console.error("Parse error:", err);
    } finally {
      setParsing(false);
    }
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
    setParsing(false);
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
                {parsing ? (
                  <>
                    <Loader2 className="mx-auto text-primary mb-3 animate-spin" size={40} />
                    <p className="text-sm font-medium text-foreground">Membaca file Anki...</p>
                    <p className="text-xs text-muted-foreground mt-1">Memproses database kartu</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center gap-3 mb-3">
                      <FileText className="text-muted-foreground" size={32} />
                      <Package className="text-primary" size={32} />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Drop file di sini atau klik untuk upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: <strong>.apkg</strong> (native Anki), .txt, .csv
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".apkg,.colpkg,.txt,.csv,.tsv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <div className="bg-muted rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Format yang didukung:</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Badge variant="default" className="text-[10px] shrink-0 mt-0.5">Baru</Badge>
                    <p className="text-xs text-muted-foreground">
                      <strong>.apkg</strong> — File deck native Anki. Export dari Anki → File → Export → "Anki Deck Package"
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">• Tab-separated: <code className="text-foreground">漢字{"\t"}meaning</code></p>
                  <p className="text-xs text-muted-foreground">• Semicolon / CSV: <code className="text-foreground">漢字;meaning</code></p>
                  <p className="text-xs text-muted-foreground">• Text export: Anki → File → Export → "Notes in Plain Text"</p>
                </div>
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
                  {fileType === "apkg" ? (
                    <Package size={16} className="text-primary" />
                  ) : (
                    <FileText size={16} className="text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {fileType === "apkg" && (
                    <Badge variant="outline" className="text-[10px]">APKG</Badge>
                  )}
                  <Badge variant="secondary">{parsedCards.length} kartu</Badge>
                </div>
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

              <div className="max-h-48 overflow-y-auto space-y-0 rounded-lg border border-border">
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
