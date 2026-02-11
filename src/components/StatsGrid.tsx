import { motion } from "framer-motion";
import { BookOpen, Flame, Clock, TrendingUp } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, subtitle, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut", delay }}
    className="zen-card hover-lift"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-serif font-bold mt-1 text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="p-2.5 rounded-lg bg-muted text-foreground">
        {icon}
      </div>
    </div>
  </motion.div>
);

const stats = [
  { icon: <BookOpen size={20} />, label: "Kanji Learned", value: "284", subtitle: "+12 this week" },
  { icon: <Flame size={20} />, label: "Study Streak", value: "17日", subtitle: "Best: 23 days" },
  { icon: <Clock size={20} />, label: "Study Time", value: "2.4h", subtitle: "Today's session" },
  { icon: <TrendingUp size={20} />, label: "Accuracy", value: "87%", subtitle: "Last 50 reviews" },
];

const StatsGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat, i) => (
      <StatCard key={stat.label} {...stat} delay={i * 0.08} />
    ))}
  </div>
);

export default StatsGrid;
