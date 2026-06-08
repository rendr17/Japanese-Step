import { BookOpen, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useProfile, useLearningProgress } from "@/hooks/useDashboardData";

const pathConfig = {
  jlpt_academic: {
    icon: BookOpen,
    label: "JLPT Academic",
    badgeClass: "jlpt-badge",
  },
  jft_practical: {
    icon: MessageCircle,
    label: "JFT Practical",
    badgeClass: "jft-badge",
  },
};

const LearningPathIndicator = () => {
  const { data: profile } = useProfile();
  const { data: progress } = useLearningProgress();
  const path = profile?.current_path ?? "jlpt_academic";
  const cfg = pathConfig[path];
  const Icon = cfg.icon;
  const progressPct = progress?.progressPct ?? 0;
  const levelLabel = (progress?.level ?? "n5").toUpperCase();

  return (
    <div className="nori-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 border border-border rounded-md text-foreground">
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <div>
          <span className={cfg.badgeClass}>{cfg.label}</span>
          <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal font-normal">
            Level aktif: {levelLabel}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground normal-case tracking-normal">
          <span>{progress?.mastered ?? 0} / {progress?.target ?? 800} kata dikuasai</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} />
      </div>
    </div>
  );
};

export default LearningPathIndicator;
