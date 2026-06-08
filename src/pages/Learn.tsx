import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLearningPath, useCompleteLesson, type LearningLesson } from "@/hooks/useLearningPath";
import { useProfile } from "@/hooks/useDashboardData";
import { useAddXP } from "@/hooks/useDailyXP";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Learn = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const path = profile?.current_path ?? "jlpt_academic";
  const level = path === "jlpt_academic" ? (profile?.default_jlpt_level ?? "n5") : "a2";
  const { data: units = [], isLoading } = useLearningPath(path, level);
  const completeLesson = useCompleteLesson();
  const addXP = useAddXP();

  const handleLessonClick = async (lesson: LearningLesson, lessonIndex: number, lessons: LearningLesson[]) => {
    const prevCompleted = lessonIndex === 0 || lessons[lessonIndex - 1]?.progress?.status === "completed";
    if (!prevCompleted && lessonIndex > 0) {
      toast.info("Selesaikan lesson sebelumnya terlebih dahulu");
      return;
    }

    if (lesson.material_id) {
      navigate(`/materials/${lesson.material_id}`);
      return;
    }

    if (lesson.starter_key) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: material } = await supabase
          .from("materials")
          .select("id")
          .eq("user_id", user.id)
          .eq("starter_key", lesson.starter_key)
          .maybeSingle();
        if (material?.id) {
          navigate(`/materials/${material.id}`);
          return;
        }
      }
    }

    navigate("/materials");
    toast.info(`Baca materi tentang "${lesson.title}" lalu tandai selesai`);
  };

  const handleMarkComplete = async (lesson: LearningLesson) => {
    const xp = await completeLesson.mutateAsync({
      lessonId: lesson.id,
      xpReward: lesson.xp_reward,
    });
    addXP.mutate({ xp: xp ?? 25, activityType: "lesson" });
    toast.success(`Lesson selesai! +${xp ?? 25} XP`);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Memuat kurikulum...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto">
      <div>
        <p className="nori-jp-display text-3xl mb-2">学習</p>
        <div className="nori-wavy-line mb-4" />
        <h1 className="text-xl font-bold uppercase tracking-wide flex items-center gap-2">
          Jalur Belajar
        </h1>
        <p className="text-muted-foreground mt-1 normal-case tracking-normal font-normal text-sm">
          Kurikulum terstruktur {path === "jlpt_academic" ? "JLPT" : "JFT"} — {level.toUpperCase()}
        </p>
      </div>

      {units.map((unit) => (
        <div key={unit.id} className="space-y-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide normal-case">{unit.title}</h2>
            {unit.description && <p className="text-sm text-muted-foreground">{unit.description}</p>}
          </div>

          <div className="space-y-2">
            {(unit.lessons ?? []).map((lesson, idx) => {
              const isCompleted = lesson.progress?.status === "completed";
              const isLocked = idx > 0 && (unit.lessons ?? [])[idx - 1]?.progress?.status !== "completed";

              return (
                <div
                  key={lesson.id}
                  className={`nori-card p-4 flex items-center gap-4 ${isLocked ? "opacity-60" : "cursor-pointer hover:bg-muted"}`}
                  onClick={() => !isLocked && handleLessonClick(lesson, idx, unit.lessons ?? [])}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isCompleted ? "bg-secondary/20 text-secondary" : isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={18} /> : <span className="font-bold text-sm">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{lesson.title}</p>
                    {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">+{lesson.xp_reward} XP</Badge>
                      {isCompleted && <Badge className="text-[10px] bg-secondary/20 text-secondary">Selesai</Badge>}
                    </div>
                  </div>
                  {!isCompleted && !isLocked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); handleMarkComplete(lesson); }}
                    >
                      Tandai Selesai
                    </Button>
                  )}
                  {!isLocked && <ArrowRight size={16} className="text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default Learn;
