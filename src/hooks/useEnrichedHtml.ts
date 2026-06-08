import { useEffect, useState } from "react";
import { hasKanjiWithoutRuby } from "@/lib/furigana";
import { enrichMorphologicalFurigana } from "@/lib/kuroshiroClient";

export function useEnrichedHtml(baseHtml: string, enabled: boolean) {
  const [html, setHtml] = useState(baseHtml);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    setHtml(baseHtml);

    if (!enabled || !baseHtml || !hasKanjiWithoutRuby(baseHtml)) {
      setIsEnriching(false);
      return;
    }

    let cancelled = false;
    setIsEnriching(true);

    enrichMorphologicalFurigana(baseHtml)
      .then((enriched) => {
        if (!cancelled) setHtml(enriched);
      })
      .catch(() => {
        if (!cancelled) setHtml(baseHtml);
      })
      .finally(() => {
        if (!cancelled) setIsEnriching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baseHtml, enabled]);

  return { html, isEnriching };
}
