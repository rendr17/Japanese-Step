import { motion } from "framer-motion";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { FlashcardItem } from "@/hooks/useFlashcards";

interface FlashcardCardProps {
  card: FlashcardItem;
  isFlipped: boolean;
  onFlip: () => void;
  showFurigana: "always" | "hover" | "never";
}

// Deteksi apakah teks berisi hanya karakter Jepang (bukan terjemahan Indonesia)
const isJapaneseMeaning = (text: string) =>
  /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s・ーっ、。]+$/.test(text.trim());

const FlashcardCard = ({ card, isFlipped, onFlip, showFurigana }: FlashcardCardProps) => {
  const [furiganaVisible, setFuriganaVisible] = useState(showFurigana === "always");
  const meaningIsJapanese = isJapaneseMeaning(card.meaning ?? "");

  const levelColors: Record<string, string> = {
    n5: "bg-secondary text-secondary-foreground",
    n4: "bg-primary text-primary-foreground",
    n3: "bg-accent text-accent-foreground",
    n2: "bg-destructive text-destructive-foreground",
    n1: "bg-foreground text-background",
  };

  const playAudio = () => {
    if (card.audio_url) {
      const audio = new Audio(card.audio_url);
      audio.play();
    } else {
      // TTS fallback using Web Speech API
      const text = card.kanji || card.kana;
      if ("speechSynthesis" in window && text) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "ja-JP";
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }
    }
  };

  return (
    <div className="perspective-1000 w-full max-w-lg mx-auto" style={{ perspective: "1000px" }}>
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onClick={onFlip}
      >
        {/* Front */}
        <div
          className="zen-card min-h-[320px] flex flex-col items-center justify-center gap-4 p-8"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Badge className={levelColors[card.jlpt_level ?? ""] ?? "bg-muted text-muted-foreground"}>
            {card.jlpt_level?.toUpperCase() ?? "—"}
          </Badge>

          <div className="text-center">
            <p className="font-jp text-7xl font-bold text-foreground leading-tight">
              {(furiganaVisible || showFurigana === "always") && card.kanji
                ? card.kana
                : (card.kanji || card.kana)}
            </p>
            {card.kanji && (
              <div
                className="mt-3"
                onMouseEnter={() => showFurigana === "hover" && setFuriganaVisible(true)}
                onMouseLeave={() => showFurigana === "hover" && setFuriganaVisible(false)}
              >
                {furiganaVisible || showFurigana === "always" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFuriganaVisible(false); }}
                    className="text-sm text-muted-foreground flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
                  >
                    <EyeOff size={14} /> Tampilkan kanji
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFuriganaVisible(true); }}
                    className="text-sm text-muted-foreground flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
                  >
                    <Eye size={14} /> Tampilkan kana
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-4">Tap untuk membalik</p>
        </div>

        {/* Back */}
        <div
          className="zen-card min-h-[320px] flex flex-col items-center justify-center gap-5 p-8 absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Japanese word + reading */}
          <div className="text-center space-y-1">
            <p className="text-4xl font-jp font-bold text-foreground">
              {card.kanji || card.kana}
            </p>
            {card.kanji && (
              <p className="text-lg font-jp text-muted-foreground">{card.kana}</p>
            )}
          </div>

          {/* Indonesian meaning */}
          <div className="w-full max-w-sm border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Arti (Bahasa Indonesia)</p>
            {meaningIsJapanese ? (
              <p className="text-base italic text-muted-foreground">
                Arti belum tersedia — gunakan tombol "Perbaiki Arti" di halaman flashcard
              </p>
            ) : (
              <p className="text-2xl font-semibold text-foreground">{card.meaning || "—"}</p>
            )}
          </div>

          {card.example_sentence && (
            <div className="bg-muted rounded-lg p-4 w-full max-w-sm">
              <p className="text-sm font-jp text-foreground leading-relaxed text-center">
                {card.example_sentence}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => { e.stopPropagation(); playAudio(); }}
          >
            <Volume2 size={16} /> {card.audio_url ? "Putar Audio" : "Ucapkan"}
          </Button>

          <p className="text-sm text-muted-foreground">Pilih jawaban di bawah</p>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardCard;
