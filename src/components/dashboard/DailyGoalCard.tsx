import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";

const CircularProgress = ({ value, max, size = 120 }: { value: number; max: number; size?: number }) => {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-serif font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">/ {max} XP</span>
      </div>
    </div>
  );
};

const DailyGoalCard = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const dailyGoal = profile?.daily_goal_xp ?? 50;
  // Simulated current XP — replace with real tracking later
  const currentXP = 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="zen-card flex flex-col items-center text-center"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Target Harian</h3>
      <CircularProgress value={currentXP} max={dailyGoal} />
      <p className="text-xs text-muted-foreground mt-3">
        ~{Math.round((dailyGoal - currentXP) * 0.6)} menit lagi
      </p>
      <Button className="mt-4 gap-2" onClick={() => navigate("/materials")}>
        Lanjutkan Belajar
        <ArrowRight size={16} />
      </Button>
    </motion.div>
  );
};

export default DailyGoalCard;
