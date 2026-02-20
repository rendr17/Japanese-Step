import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useFlashcardSession } from "@/hooks/useFlashcards";
import FlashcardCard from "@/components/flashcard/FlashcardCard";
import AnswerButtons from "@/components/flashcard/AnswerButtons";
import SessionComplete from "@/components/flashcard/SessionComplete";
import AnkiImportDialog from "@/components/flashcard/AnkiImportDialog";
import DeckList from "@/components/flashcard/DeckList";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Layers, Target, Settings2, BookOpen, Wrench, LayoutList } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const isJapaneseMeaning = (text: string) =>
  /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s・ーっ、。]+$/.test(text.trim());

const Flashcards = () => {
  const [maxCards, setMaxCards] = useState(20);
  const [showFurigana, setShowFurigana] = useState<"always" | "hover" | "never">("hover");
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixProgress, setFixProgress] = useState({ done: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<"review" | "decks">("review");
  const [studyingDeck, setStudyingDeck] = useState<string | null>(null);

  const handleFixBadMeanings = useCallback(async () => {
    setIsFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Silakan login terlebih dahulu"); return; }

      const { data: allVocab, error } = await supabase
        .from("vocab_bank")
        .select("id, kanji, kana, meaning")
        .eq("user_id", user.id);
      if (error) throw error;

      const badEntries = (allVocab ?? []).filter((v) => isJapaneseMeaning(v.meaning ?? ""));
      if (badEntries.length === 0) {
        toast.success("Semua arti sudah dalam Bahasa Indonesia! ✓");
        setIsFixing(false);
        return;
      }

      setFixProgress({ done: 0, total: badEntries.length });
      toast.info(`Memperbaiki ${badEntries.length} kosakata...`);

      let fixed = 0;
      for (const entry of badEntries) {
        try {
          const { data, error: fnError } = await supabase.functions.invoke("vocab-ai-fill", {
            body: { kanji: entry.kanji || entry.kana },
          });
          if (!fnError && data?.meaning) {
            await supabase.from("vocab_bank").update({ meaning: data.meaning }).eq("id", entry.id);
            fixed++;
          }
        } catch {
          // skip individual failures
        }
        setFixProgress({ done: fixed, total: badEntries.length });
      }

      toast.success(`${fixed} dari ${badEntries.length} arti berhasil diperbaiki!`);
      window.location.reload();
    } catch (e) {
      toast.error("Gagal memperbaiki data");
    } finally {
      setIsFixing(false);
    }
  }, []);

  const {
    currentCard,
    currentIndex,
    isFlipped,
    flipCard,
    answerCard,
    sessionStats,
    isComplete,
    isLoading,
    resetSession,
    isReviewing,
    totalCards,
  } = useFlashcardSession(maxCards);

  const timeSpent = Math.round((Date.now() - sessionStats.startTime) / 60000);
  const progressPercent = totalCards > 0 ? (sessionStats.reviewed / totalCards) * 100 : 0;

  // Auto-play audio when card flips to back
  useEffect(() => {
    if (autoPlayAudio && isFlipped && currentCard?.audio_url) {
      const audio = new Audio(currentCard.audio_url);
      audio.play();
    }
  }, [isFlipped, autoPlayAudio, currentCard]);

  // Spacebar to flip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isComplete && studyingDeck !== null) {
        e.preventDefault();
        flipCard();
      } else if (e.code === "Space" && !isComplete && activeTab === "review") {
        e.preventDefault();
        flipCard();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipCard, isComplete, activeTab, studyingDeck]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="py-8">
        <SessionComplete
          stats={sessionStats}
          onRestart={() => { resetSession(); setStudyingDeck(null); }}
        />
      </div>
    );
  }

  // ── Deck study mode ──
  if (studyingDeck !== null) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStudyingDeck(null)}>
            ← Kembali
          </Button>
          <h1 className="text-xl font-serif font-bold text-foreground">
            Deck:{" "}
            <span className="text-primary">
              {studyingDeck === "anki-import" ? "Anki Import" : studyingDeck}
            </span>
          </h1>
        </motion.div>

        {totalCards === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="mx-auto text-muted-foreground" size={48} />
            <p className="text-muted-foreground">Tidak ada kartu due di deck ini.</p>
            <Button variant="outline" onClick={() => setStudyingDeck(null)}>Kembali ke Deck</Button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Kartu {sessionStats.reviewed + 1} / {totalCards}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {currentCard && (
              <FlashcardCard card={currentCard} isFlipped={isFlipped} onFlip={flipCard} showFurigana={showFurigana} />
            )}

            {isFlipped && currentCard && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <AnswerButtons
                  onAnswer={answerCard}
                  disabled={isReviewing}
                  currentInterval={currentCard.srs_interval}
                  currentEase={currentCard.srs_ease}
                />
              </motion.div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Tekan <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> untuk membalik
              {isFlipped && " · 1-4 untuk menjawab"}
            </p>
          </>
        )}
      </div>
    );
  }

  // ── Main view ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-serif font-bold text-foreground">Flashcard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleFixBadMeanings}
            disabled={isFixing}
            title="Perbaiki arti yang masih berisi kana bukan Bahasa Indonesia"
          >
            <Wrench size={14} />
            {isFixing ? `Memperbaiki ${fixProgress.done}/${fixProgress.total}...` : "Perbaiki Arti"}
          </Button>
          <AnkiImportDialog onImportComplete={() => window.location.reload()} />
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings2 size={20} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </motion.div>

      {/* Settings panel */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="zen-card p-4 space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-sm">Maks kartu per sesi: {maxCards}</Label>
              <Slider value={[maxCards]} onValueChange={([v]) => setMaxCards(v)} min={5} max={50} step={5} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Furigana</Label>
              <Select value={showFurigana} onValueChange={(v) => setShowFurigana(v as "always" | "hover" | "never")}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Selalu</SelectItem>
                  <SelectItem value="hover">Hover</SelectItem>
                  <SelectItem value="never">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Auto-play audio</Label>
              <Switch checked={autoPlayAudio} onCheckedChange={setAutoPlayAudio} />
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "review" | "decks")}>
        <TabsList className="w-full">
          <TabsTrigger value="review" className="flex-1 gap-2">
            <BookOpen size={15} /> Review Semua
          </TabsTrigger>
          <TabsTrigger value="decks" className="flex-1 gap-2">
            <LayoutList size={15} /> Daftar Deck
          </TabsTrigger>
        </TabsList>

        {/* Review tab */}
        <TabsContent value="review" className="space-y-5 mt-4">
          {totalCards === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen className="mx-auto text-muted-foreground" size={48} />
              <h2 className="text-xl font-serif font-bold text-foreground">Tidak Ada Kartu untuk Direview</h2>
              <p className="text-muted-foreground text-sm">
                Semua kartu sudah direview! Cek deck di tab Daftar Deck atau import file baru.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="zen-card p-3 flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">{totalCards}</p>
                  </div>
                </div>
                <div className="zen-card p-3 flex items-center gap-2">
                  <Target size={16} className="text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sisa</p>
                    <p className="text-lg font-bold text-foreground">{totalCards - sessionStats.reviewed}</p>
                  </div>
                </div>
                <div className="zen-card p-3 flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu</p>
                    <p className="text-lg font-bold text-foreground">{timeSpent} min</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Kartu {sessionStats.reviewed + 1} / {totalCards}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {currentCard && (
                <FlashcardCard card={currentCard} isFlipped={isFlipped} onFlip={flipCard} showFurigana={showFurigana} />
              )}

              {isFlipped && currentCard && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <AnswerButtons
                    onAnswer={answerCard}
                    disabled={isReviewing}
                    currentInterval={currentCard.srs_interval}
                    currentEase={currentCard.srs_ease}
                  />
                </motion.div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Tekan <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> untuk membalik
                {isFlipped && " · 1-4 untuk menjawab"}
              </p>
            </>
          )}
        </TabsContent>

        {/* Decks tab */}
        <TabsContent value="decks" className="mt-4">
          <div className="zen-card overflow-hidden">
            <DeckList onStudyDeck={(tag) => setStudyingDeck(tag)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Flashcards;
