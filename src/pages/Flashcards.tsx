import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFlashcardSession } from "@/hooks/useFlashcards";
import FlashcardCard from "@/components/flashcard/FlashcardCard";
import AnswerButtons from "@/components/flashcard/AnswerButtons";
import SessionComplete from "@/components/flashcard/SessionComplete";
import AnkiImportDialog from "@/components/flashcard/AnkiImportDialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Clock, Layers, Target, Settings2, BookOpen } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Flashcards = () => {
  const [maxCards, setMaxCards] = useState(20);
  const [showFurigana, setShowFurigana] = useState<"always" | "hover" | "never">("hover");
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      if (e.code === "Space" && !isComplete) {
        e.preventDefault();
        flipCard();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipCard, isComplete]);

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

  if (totalCards === 0 && !isComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <BookOpen className="mx-auto text-muted-foreground" size={48} />
        <h2 className="text-2xl font-serif font-bold text-foreground">Tidak Ada Kartu untuk Direview</h2>
        <p className="text-muted-foreground">
          Semua kartu sudah direview! Tambahkan kosakata baru atau tunggu jadwal review berikutnya.
        </p>
        <div className="flex gap-2">
          <AnkiImportDialog onImportComplete={() => window.location.reload()} />
          <Button variant="outline" onClick={() => window.location.href = "/vocabulary"}>
            Tambah Kosakata
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="py-8">
        <SessionComplete stats={sessionStats} onRestart={resetSession} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-2xl font-serif font-bold text-foreground">Flashcard Review</h1>
        <div className="flex items-center gap-2">
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
              <Slider
                value={[maxCards]}
                onValueChange={([v]) => setMaxCards(v)}
                min={5}
                max={50}
                step={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Furigana</Label>
              <Select value={showFurigana} onValueChange={(v) => setShowFurigana(v as "always" | "hover" | "never")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
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

      {/* Stats bar */}
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

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Kartu {sessionStats.reviewed + 1} / {totalCards}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Card */}
      {currentCard && (
        <FlashcardCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={flipCard}
          showFurigana={showFurigana}
        />
      )}

      {/* Answer buttons - only when flipped */}
      {isFlipped && currentCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnswerButtons
            onAnswer={answerCard}
            disabled={isReviewing}
            currentInterval={currentCard.srs_interval}
            currentEase={currentCard.srs_ease}
          />
        </motion.div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Tekan <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> untuk membalik
        {isFlipped && " · 1-4 untuk menjawab"}
      </p>
    </div>
  );
};

export default Flashcards;
