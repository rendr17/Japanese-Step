import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisToken {
  kanji: string;
  kana: string;
  meaning: string;
  type: string;
}

export interface AnalysisGrammar {
  pattern: string;
  structure: string;
  explanation: string;
}

export interface SimilarSentence {
  japanese: string;
  meaning: string;
}

export interface SentenceAnalysis {
  tokens: AnalysisToken[];
  grammar: AnalysisGrammar;
  politeness: "casual" | "polite" | "formal" | "honorific";
  jlpt_level: string;
  cultural_notes: string;
  similar_sentences: SimilarSentence[];
}

const RATE_LIMIT_KEY = "analyzer_requests";
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function getRateLimitInfo(): { count: number; remaining: number; resetAt: number } {
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const now = Date.now();
  if (raw) {
    const parsed = JSON.parse(raw);
    if (now - parsed.startedAt < RATE_LIMIT_WINDOW) {
      return { count: parsed.count, remaining: Math.max(0, RATE_LIMIT_MAX - parsed.count), resetAt: parsed.startedAt + RATE_LIMIT_WINDOW };
    }
  }
  return { count: 0, remaining: RATE_LIMIT_MAX, resetAt: now + RATE_LIMIT_WINDOW };
}

function incrementRateLimit() {
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const now = Date.now();
  if (raw) {
    const parsed = JSON.parse(raw);
    if (now - parsed.startedAt < RATE_LIMIT_WINDOW) {
      parsed.count += 1;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(parsed));
      return;
    }
  }
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 1, startedAt: now }));
}

export function useAnalyzeSentence() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SentenceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rateLimitInfo = getRateLimitInfo();

  const analyze = async (sentence: string) => {
    const info = getRateLimitInfo();
    if (info.remaining <= 0) {
      const resetIn = Math.ceil((info.resetAt - Date.now()) / 60000);
      setError(`Rate limit tercapai. Coba lagi dalam ${resetIn} menit.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-sentence", {
        body: { sentence },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      incrementRateLimit();
      setResult(data as SentenceAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { analyze, result, isLoading, error, clear, remaining: getRateLimitInfo().remaining };
}
