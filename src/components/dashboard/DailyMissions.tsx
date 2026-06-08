import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTodayXP } from "@/hooks/useDailyXP";
import { useProfile, useDueReviews } from "@/hooks/useDashboardData";
import { useStudyModeProgress } from "@/hooks/useLearningPath";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Mission {
  id: string;
  label: string;
  target: number;
  current: number;
  link: string;
  done: boolean;
}

export function useDailyMissions() {
  const { data: todayXp = 0 } = useTodayXP();
  const { data: profile } = useProfile();
  const { data: dueReviews = [] } = useDueReviews();
  const { data: studyModes = [] } = useStudyModeProgress();

  return useQuery({
    queryKey: ["daily-missions", todayXp, dueReviews.length, studyModes],
    queryFn: async (): Promise<Mission[]> => {
      const goal = profile?.daily_goal_xp ?? 50;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date().toISOString().split("T")[0];
      const { count: flashcardSessions } = await supabase
        .from("study_sessions" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("activity_type", "flashcard")
        .gte("started_at", `${today}T00:00:00`);

      const { count: lessonsToday } = await supabase
        .from("user_lesson_progress" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", `${today}T00:00:00`);

      const { count: practiceToday } = await supabase
        .from("practice_sessions" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`);

      return [
        {
          id: "xp",
          label: `Capai ${goal} XP harian`,
          target: goal,
          current: todayXp,
          link: "/practice",
          done: todayXp >= goal,
        },
        {
          id: "flashcard",
          label: "Review flashcard (1 sesi)",
          target: 1,
          current: flashcardSessions ?? 0,
          link: "/flashcards",
          done: (flashcardSessions ?? 0) >= 1,
        },
        {
          id: "lesson",
          label: "Selesaikan 1 lesson",
          target: 1,
          current: lessonsToday ?? 0,
          link: "/learn",
          done: (lessonsToday ?? 0) >= 1,
        },
        {
          id: "practice",
          label: "Kerjakan 1 drill latihan",
          target: 1,
          current: practiceToday ?? 0,
          link: "/practice",
          done: (practiceToday ?? 0) >= 1,
        },
      ];
    },
    staleTime: 60 * 1000,
  });
}

const DailyMissions = () => {
  const { data: missions = [] } = useDailyMissions();
  const navigate = useNavigate();
  const completed = missions.filter((m) => m.done).length;

  return (
    <Card className="nori-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between normal-case tracking-normal">
          Misi Harian
          <span className="text-xs font-normal text-muted-foreground">{completed}/{missions.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {missions.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => navigate(m.link)}
            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left transition-colors"
          >
            {m.done ? (
              <CheckCircle2 size={18} className="text-primary shrink-0" />
            ) : (
              <Circle size={18} className="text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm normal-case tracking-normal font-normal ${m.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {m.label}
              </p>
              {!m.done && m.id === "xp" && (
                <p className="text-xs text-muted-foreground normal-case">{m.current}/{m.target} XP</p>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default DailyMissions;
