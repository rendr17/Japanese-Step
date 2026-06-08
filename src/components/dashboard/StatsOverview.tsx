import { BookOpen, Award, Clock } from "lucide-react";
import { useVocabStats } from "@/hooks/useDashboardData";
import { useWeeklyStudyMinutes } from "@/hooks/useDailyXP";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtitle: string;
}

const StatItem = ({ icon, label, value, suffix, subtitle }: StatItemProps) => (
  <div className="nori-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium normal-case tracking-normal">{label}</p>
        <p className="text-3xl font-bold text-foreground normal-case tracking-normal">
          {value}{suffix}
        </p>
        <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal font-normal">{subtitle}</p>
      </div>
      <div className="p-2 border border-border rounded-md text-foreground">{icon}</div>
    </div>
  </div>
);

const StatsOverview = () => {
  const { data: stats } = useVocabStats();
  const { data: weeklyMinutes = 0 } = useWeeklyStudyMinutes();

  const items: StatItemProps[] = [
    {
      icon: <BookOpen size={18} strokeWidth={1.75} />,
      label: "Total Kosakata",
      value: stats?.total ?? 0,
      suffix: " kata",
      subtitle: "dalam bank kosakata",
    },
    {
      icon: <Award size={18} strokeWidth={1.75} />,
      label: "Dikuasai",
      value: stats?.mastered ?? 0,
      suffix: " kata",
      subtitle: "status mastered",
    },
    {
      icon: <Clock size={18} strokeWidth={1.75} />,
      label: "Minggu Ini",
      value: weeklyMinutes,
      suffix: " menit",
      subtitle: "waktu belajar",
    },
  ];

  return (
    <div>
      <p className="nori-jp-display text-2xl mb-1">統計</p>
      <h2 className="nori-section-title mb-4">Statistik</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
