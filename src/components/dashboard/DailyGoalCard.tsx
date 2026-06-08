import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useDashboardData";
import { useTodayXP } from "@/hooks/useDailyXP";
import { useNavigate } from "react-router-dom";

const DailyGoalCard = () => {
  const { data: profile } = useProfile();
  const { data: currentXP = 0 } = useTodayXP();
  const navigate = useNavigate();
  const dailyGoal = profile?.daily_goal_xp ?? 50;
  const remaining = Math.max(0, dailyGoal - currentXP);
  const progressPct = Math.min((currentXP / dailyGoal) * 100, 100);

  return (
    <div className="nori-card flex flex-col">
      <p className="nori-section-title mb-4">Target Harian</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-bold text-foreground">{currentXP}</span>
        <span className="text-sm text-muted-foreground mb-1 normal-case tracking-normal">/ {dailyGoal} XP</span>
      </div>
      <Progress value={progressPct} className="mb-3" />
      <p className="text-xs text-muted-foreground normal-case tracking-normal font-normal mb-4">
        {remaining > 0 ? `~${Math.round(remaining * 0.6)} menit lagi` : "Target hari ini tercapai!"}
      </p>
      <Button className="mt-auto gap-2 w-full" onClick={() => navigate("/materials")}>
        Lanjutkan Belajar
        <ArrowRight size={16} />
      </Button>
    </div>
  );
};

export default DailyGoalCard;
