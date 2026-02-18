import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FlashcardItem {
  id: string;
  vocab_id: string;
  kanji: string | null;
  kana: string;
  meaning: string;
  example_sentence: string | null;
  jlpt_level: string | null;
  audio_url: string | null;
  srs_interval: number;
  srs_ease: number;
  srs_repetitions: number;
}

export interface SessionStats {
  total: number;
  reviewed: number;
  correct: number;
  incorrect: number;
  startTime: number;
}

export interface ReviewResult {
  next_review_date: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: string;
}

export function useDueCards(maxCards: number = 20) {
  return useQuery({
    queryKey: ["flashcard-due-cards", maxCards],
    queryFn: async (): Promise<FlashcardItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get due SRS logs
      const { data: srsData, error: srsError } = await supabase
        .from("srs_logs")
        .select("vocab_id, interval_days, ease_factor, repetitions")
        .eq("user_id", user.id)
        .lte("next_review_date", new Date().toISOString())
        .order("next_review_date", { ascending: true })
        .limit(maxCards);

      if (srsError) throw srsError;
      if (!srsData || srsData.length === 0) return [];

      const vocabIds = srsData.map((s) => s.vocab_id);

      const { data: vocabData, error: vocabError } = await supabase
        .from("vocab_bank")
        .select("*")
        .in("id", vocabIds);

      if (vocabError) throw vocabError;

      const srsMap = new Map(srsData.map((s) => [s.vocab_id, s]));

      return (vocabData ?? []).map((v) => {
        const srs = srsMap.get(v.id);
        return {
          id: v.id,
          vocab_id: v.id,
          kanji: v.kanji,
          kana: v.kana,
          meaning: v.meaning,
          example_sentence: v.example_sentence,
          jlpt_level: v.jlpt_level,
          audio_url: v.audio_url,
          srs_interval: srs?.interval_days ?? 0,
          srs_ease: srs?.ease_factor ?? 2.5,
          srs_repetitions: srs?.repetitions ?? 0,
        };
      });
    },
  });
}

export function useProcessReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocab_id, quality }: { vocab_id: string; quality: number }): Promise<ReviewResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("process-srs-review", {
        body: { vocab_id, quality },
      });

      if (error) throw error;
      return data as ReviewResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcard-due-cards"] });
      qc.invalidateQueries({ queryKey: ["vocab-srs-statuses"] });
    },
    onError: (err) => {
      toast.error("Gagal memproses review: " + err.message);
    },
  });
}

export function useFlashcardSession(maxCards: number = 20) {
  const { data: dueCards, isLoading, refetch } = useDueCards(maxCards);
  const processReview = useProcessReview();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    reviewed: 0,
    correct: 0,
    incorrect: 0,
    startTime: Date.now(),
  });
  const [isComplete, setIsComplete] = useState(false);
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);

  useEffect(() => {
    if (dueCards) {
      setSessionStats((prev) => ({ ...prev, total: dueCards.length }));
    }
  }, [dueCards]);

  const currentCard = dueCards?.[currentIndex] ?? null;

  const flipCard = useCallback(() => setIsFlipped((f) => !f), []);

  const answerCard = useCallback(
    async (quality: number) => {
      if (!currentCard) return;

      try {
        const result = await processReview.mutateAsync({
          vocab_id: currentCard.vocab_id,
          quality,
        });

        setReviewResults((prev) => [...prev, result]);
        setSessionStats((prev) => ({
          ...prev,
          reviewed: prev.reviewed + 1,
          correct: quality >= 3 ? prev.correct + 1 : prev.correct,
          incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
        }));

        setIsFlipped(false);

        if (currentIndex + 1 >= (dueCards?.length ?? 0)) {
          setIsComplete(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      } catch {
        // Error handled by mutation
      }
    },
    [currentCard, currentIndex, dueCards, processReview]
  );

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
    setReviewResults([]);
    setSessionStats({
      total: 0,
      reviewed: 0,
      correct: 0,
      incorrect: 0,
      startTime: Date.now(),
    });
    refetch();
  }, [refetch]);

  return {
    currentCard,
    currentIndex,
    isFlipped,
    flipCard,
    answerCard,
    sessionStats,
    isComplete,
    isLoading,
    reviewResults,
    resetSession,
    isReviewing: processReview.isPending,
    totalCards: dueCards?.length ?? 0,
  };
}

// Calculate preview of next interval
export function previewInterval(currentInterval: number, ease: number, quality: number): string {
  let interval: number;
  if (quality < 3) {
    interval = 0;
  } else if (quality === 3) {
    interval = Math.max(1, Math.round(currentInterval * 1.2));
  } else if (quality === 4) {
    interval = Math.max(1, Math.round(currentInterval * ease));
  } else {
    interval = Math.max(1, Math.round(currentInterval * ease * 1.3));
  }

  if (interval === 0) return "Sekarang";
  if (interval === 1) return "1 hari";
  if (interval < 7) return `${interval} hari`;
  if (interval < 30) return `${Math.round(interval / 7)} minggu`;
  return `${Math.round(interval / 30)} bulan`;
}
