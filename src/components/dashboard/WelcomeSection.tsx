import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useDashboardData";
import { useTodayXP } from "@/hooks/useDailyXP";
import LearningIllustration from "@/assets/LearningIllustration";

const getJapaneseGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "おはよう";
  if (h < 18) return "こんにちは";
  return "こんばんは";
};

const getJapaneseDate = () => {
  const d = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
};

const WelcomeSection = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const name = profile?.display_name || "Learner";

  return (
    <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div>
        <p className="nori-jp-display text-5xl sm:text-6xl mb-3">学習</p>
        <div className="nori-wavy-line mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground leading-tight mb-3">
          {getJapaneseGreeting()}, {name} —{" "}
          <span className="text-primary">Keep Learning</span> Every Day
        </h1>
        <p className="text-muted-foreground normal-case tracking-normal font-normal text-sm mb-2 max-w-md">
          Platform belajar bahasa Jepang dengan materi JLPT, latihan interaktif, dan bantuan AI sensei.
        </p>
        <p className="text-sm text-muted-foreground font-jp mb-6">{getJapaneseDate()}</p>
        <Button className="gap-2" onClick={() => navigate("/learn")}>
          Mulai Belajar
          <ArrowRight size={16} />
        </Button>
      </div>
      <div className="hidden sm:flex justify-center lg:justify-end">
        <LearningIllustration className="w-full max-w-xs lg:max-w-sm" />
      </div>
    </div>
  );
};

export default WelcomeSection;
