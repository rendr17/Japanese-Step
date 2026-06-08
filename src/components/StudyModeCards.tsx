import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStudyModeProgress } from "@/hooks/useLearningPath";

type StudyMode = "jlpt" | "jft";

interface StudyModeCardProps {
  mode: StudyMode;
  level: string;
  title: string;
  description: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  onClick: () => void;
}

const StudyModeCard = ({
  mode,
  level,
  title,
  description,
  progress,
  totalItems,
  completedItems,
  onClick,
}: StudyModeCardProps) => {
  const isJLPT = mode === "jlpt";

  return (
    <div className="nori-card cursor-pointer group" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-border rounded-md text-foreground">
            {isJLPT ? <BookOpen size={18} strokeWidth={1.75} /> : <FileText size={18} strokeWidth={1.75} />}
          </div>
          <span className={isJLPT ? "jlpt-badge" : "jft-badge"}>{level}</span>
        </div>
        <ArrowRight size={16} className="text-muted-foreground" />
      </div>

      <h3 className="text-base font-bold uppercase tracking-wide text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 normal-case tracking-normal font-normal">{description}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground normal-case tracking-normal">
          <span>{completedItems} / {totalItems} lesson</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
};

const StudyModeCards = () => {
  const navigate = useNavigate();
  const { data: modes = [], isLoading } = useStudyModeProgress();

  if (isLoading) {
    return <div className="h-32 rounded-lg bg-muted animate-pulse" />;
  }

  if (modes.length === 0) return null;

  return (
    <div>
      <p className="nori-jp-display text-2xl mb-1">勉強</p>
      <h2 className="nori-section-title mb-4">Study Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode) => (
          <StudyModeCard
            key={mode.level}
            {...mode}
            onClick={() => navigate("/learn")}
          />
        ))}
      </div>
    </div>
  );
};

export default StudyModeCards;
