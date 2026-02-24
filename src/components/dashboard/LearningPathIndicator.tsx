import { motion } from "framer-motion";
import { BookOpen, MessageCircle, ArrowRight } from "lucide-react";
import { useProfile, useLearningProgress } from "@/hooks/useDashboardData";

const pathConfig = {
  jlpt_academic: {
    icon: <BookOpen size={20} />,
    emoji: "📚",
    label: "JLPT Academic",
    colorClass: "text-jlpt",
    bgClass: "bg-jlpt-muted",
    badgeClass: "jlpt-badge",
    progressColor: "bg-jlpt",
  },
  jft_practical: {
    icon: <MessageCircle size={20} />,
    emoji: "💬",
    label: "JFT Practical",
    colorClass: "text-jft",
    bgClass: "bg-jft-muted",
    badgeClass: "jft-badge",
    progressColor: "bg-jft",
  },
};

const LearningPathIndicator = () => {
  const { data: profile } = useProfile();
  const { data: progress } = useLearningProgress();
  const path = profile?.current_path ?? "jlpt_academic";
  const cfg = pathConfig[path];
  const progressPct = progress?.progressPct ?? 0;
  const levelLabel = (progress?.level ?? "n5").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.25 }}
      className="zen-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${cfg.bgClass} ${cfg.colorClass}`}>
            {cfg.icon}
          </div>
          <div>
            <span className={cfg.badgeClass}>{cfg.label}</span>
            <p className="text-xs text-muted-foreground mt-1">Level aktif: {levelLabel}</p>
          </div>
        </div>
        <span className="text-2xl">{cfg.emoji}</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress?.mastered ?? 0} / {progress?.target ?? 800} kata dikuasai</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            className={`h-full rounded-full ${cfg.progressColor}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LearningPathIndicator;
