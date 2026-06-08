import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WeakArea {
  area: string;
  section: string;
  percentage: number;
  link: string;
}

const SECTION_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  kanji_reading: "Kanji",
  conversation: "Conversation",
  situational: "Situational",
};

const SECTION_LINKS: Record<string, string> = {
  vocabulary: "/vocabulary",
  grammar: "/practice?drill=grammar",
  reading: "/materials?category=reading",
  kanji_reading: "/kana",
  conversation: "/practice?drill=roleplay",
  situational: "/practice?drill=grammar",
};

const DEFAULT_AREAS: WeakArea[] = [
  { area: "Grammar", section: "grammar", percentage: 50, link: "/practice?drill=grammar" },
  { area: "Reading", section: "reading", percentage: 50, link: "/materials?category=reading" },
  { area: "Vocabulary", section: "vocabulary", percentage: 50, link: "/vocabulary" },
];

export function useWeakAreas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weak-areas", user?.id],
    queryFn: async (): Promise<WeakArea[]> => {
      if (!user) return DEFAULT_AREAS;

      const { data, error } = await supabase
        .from("exam_results")
        .select("answers")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data?.length) return DEFAULT_AREAS;

      const sectionStats: Record<string, { correct: number; total: number }> = {};

      for (const result of data) {
        const answers = (result.answers as Array<{ section?: string; correct?: boolean }>) ?? [];
        for (const a of answers) {
          const section = a.section ?? "grammar";
          if (!sectionStats[section]) sectionStats[section] = { correct: 0, total: 0 };
          sectionStats[section].total++;
          if (a.correct) sectionStats[section].correct++;
        }
      }

      const areas = Object.entries(sectionStats)
        .map(([section, stats]) => ({
          area: SECTION_LABELS[section] ?? section,
          section,
          percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 50,
          link: SECTION_LINKS[section] ?? "/practice",
        }))
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 3);

      return areas.length > 0 ? areas : DEFAULT_AREAS;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
