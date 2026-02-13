import { motion, animate } from "framer-motion";
import { BookOpen, Award, Clock } from "lucide-react";
import { useVocabStats } from "@/hooks/useDashboardData";
import { useEffect, useRef } from "react";

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v) + suffix;
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, suffix]);

  return <span ref={ref} className="text-3xl font-serif font-bold text-foreground">0{suffix}</span>;
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtitle: string;
  delay: number;
}

const StatItem = ({ icon, label, value, suffix, subtitle, delay }: StatItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut", delay }}
    className="zen-card hover-lift"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <AnimatedCounter value={value} suffix={suffix} />
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="p-2.5 rounded-lg bg-muted text-foreground">{icon}</div>
    </div>
  </motion.div>
);

const StatsOverview = () => {
  const { data: stats } = useVocabStats();

  const items: StatItemProps[] = [
    {
      icon: <BookOpen size={20} />,
      label: "Total Kosakata",
      value: stats?.total ?? 0,
      suffix: " kata",
      subtitle: "dalam bank kosakata",
      delay: 0.1,
    },
    {
      icon: <Award size={20} />,
      label: "Dikuasai",
      value: stats?.mastered ?? 0,
      suffix: " kata",
      subtitle: "status mastered",
      delay: 0.18,
    },
    {
      icon: <Clock size={20} />,
      label: "Minggu Ini",
      value: 0,
      suffix: " menit",
      subtitle: "waktu belajar",
      delay: 0.26,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Statistik</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
