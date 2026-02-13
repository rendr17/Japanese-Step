import { motion } from "framer-motion";
import { BookOpen, MessageCircle, ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/useDashboardData";
import { Progress } from "@/components/ui/progress";

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
  const path = profile?.current_path ?? "jlpt_academic";
  const cfg = pathConfig[path];
  // Placeholder progress — connect to real data later
  const progressPct = 42;

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
            <p className="text-xs text-muted-foreground mt-1">Jalur belajar aktif</p>
          </div>
        </div>
        <span className="text-2xl">{cfg.emoji}</span>
      </div>

      {path === "jlpt_academic" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress ke level berikutnya</span>
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
      )}
    </motion.div>
  );
};

export default LearningPathIndicator;
