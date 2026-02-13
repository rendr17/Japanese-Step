import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useDashboardData";

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
  const name = profile?.display_name || "Learner";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">
          {getJapaneseGreeting()}, {name}!
        </h1>
        <motion.span
          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="text-3xl inline-block origin-[70%_70%]"
        >
          👋
        </motion.span>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-sm text-muted-foreground font-jp">{getJapaneseDate()}</span>
        <span className="text-sm font-medium text-accent flex items-center gap-1">
          🔥 {profile ? "学習を続けよう" : "始めましょう"}
        </span>
      </div>
    </motion.div>
  );
};

export default WelcomeSection;
