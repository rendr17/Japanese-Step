import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, BookOpen, Layers, Flame, Trophy, Calendar, TrendingUp, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const JLPT_COLORS: Record<string, string> = {
  n5: "hsl(var(--secondary))",
  n4: "hsl(var(--primary))",
  n3: "hsl(var(--accent))",
  n2: "hsl(var(--srs))",
  n1: "hsl(var(--destructive))",
  none: "hsl(var(--muted-foreground))",
};

const chartConfig = {
  count: { label: "Kosakata", color: "hsl(var(--primary))" },
};

function useProgressData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress-data", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Vocab by level
      const { data: vocabs } = await supabase
        .from("vocab_bank")
        .select("jlpt_level")
        .eq("user_id", user.id);

      const levelCounts: Record<string, number> = { n5: 0, n4: 0, n3: 0, n2: 0, n1: 0, none: 0 };
      (vocabs ?? []).forEach((v) => {
        const key = v.jlpt_level ?? "none";
        levelCounts[key] = (levelCounts[key] ?? 0) + 1;
      });
      const vocabByLevel = Object.entries(levelCounts)
        .map(([level, count]) => ({ level: level.toUpperCase(), count, fill: JLPT_COLORS[level] }))
        .filter((x) => x.count > 0);
      const totalVocab = (vocabs ?? []).length;

      // SRS status breakdown
      const { data: srsData } = await supabase
        .from("srs_logs")
        .select("status")
        .eq("user_id", user.id);

      const srsCounts: Record<string, number> = { new: 0, learning: 0, review: 0, mastered: 0 };
      (srsData ?? []).forEach((s) => { srsCounts[s.status] = (srsCounts[s.status] ?? 0) + 1; });
      const srsTotal = (srsData ?? []).length;

      // SRS due today
      const now = new Date().toISOString();
      const { count: dueCount } = await supabase
        .from("srs_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_date", now)
        .neq("status", "mastered");

      // Study sessions last 7 days
      const days7 = new Date();
      days7.setDate(days7.getDate() - 6);
      const { data: sessions } = await supabase
        .from("study_sessions" as any)
        .select("started_at, duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", days7.toISOString())
        .not("ended_at", "is", null);

      // Group by day
      const dailyMinutes: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toLocaleDateString("id-ID", { weekday: "short" });
        dailyMinutes[key] = 0;
      }
      (sessions as any[] ?? []).forEach((s: any) => {
        const key = new Date(s.started_at).toLocaleDateString("id-ID", { weekday: "short" });
        if (key in dailyMinutes) {
          dailyMinutes[key] += Math.round((s.duration_seconds ?? 0) / 60);
        }
      });
      const weeklyChart = Object.entries(dailyMinutes).map(([day, minutes]) => ({ day, minutes }));

      // Exam results last 5
      const { data: examResults } = await supabase
        .from("exam_results")
        .select("created_at, score, total_questions, exam_type, level")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(10);

      const examProgression = (examResults ?? []).map((r) => ({
        date: new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        score: Math.round((r.score / r.total_questions) * 100),
        label: `${r.exam_type.toUpperCase()} ${r.level.toUpperCase()}`,
      }));

      // Streak from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak")
        .eq("id", user.id)
        .single();

      return {
        totalVocab,
        vocabByLevel,
        srsCounts,
        srsTotal,
        dueCount: dueCount ?? 0,
        weeklyChart,
        examProgression,
        currentStreak: (profile as any)?.current_streak ?? 0,
        longestStreak: (profile as any)?.longest_streak ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

const ProgressPage = () => {
  const { data, isLoading } = useProgressData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm animate-pulse">Memuat data progress...</div>
      </div>
    );
  }

  const srsStatusItems = [
    { key: "new", label: "Baru", color: "bg-muted-foreground" },
    { key: "learning", label: "Belajar", color: "bg-accent" },
    { key: "review", label: "Review", color: "bg-primary" },
    { key: "mastered", label: "Dikuasai", color: "bg-secondary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="text-primary" size={28} />
          Progress Belajar
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Pantau perkembangan belajarmu dari waktu ke waktu</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <BookOpen size={20} />,
            label: "Total Kosakata",
            value: data?.totalVocab ?? 0,
            suffix: " kata",
            color: "text-primary",
          },
          {
            icon: <Layers size={20} />,
            label: "Dalam SRS",
            value: data?.srsTotal ?? 0,
            suffix: " kartu",
            color: "text-srs",
          },
          {
            icon: <Target size={20} />,
            label: "Due Sekarang",
            value: data?.dueCount ?? 0,
            suffix: " kartu",
            color: "text-accent",
          },
          {
            icon: <Flame size={20} />,
            label: "Streak",
            value: data?.currentStreak ?? 0,
            suffix: " hari",
            color: "text-destructive",
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="nori-card"
          >
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-serif font-bold text-foreground">
              {s.value}<span className="text-sm font-normal text-muted-foreground">{s.suffix}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vocab by JLPT Level */}
        <Card className="nori-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              Kosakata per Level JLPT
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.vocabByLevel ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada kosakata</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={data?.vocabByLevel ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="level" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(data?.vocabByLevel ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* SRS Status Breakdown */}
        <Card className="nori-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers size={16} className="text-srs" />
              Status SRS Flashcard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.srsTotal === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada kartu SRS</p>
            ) : (
              srsStatusItems.map((s) => {
                const count = data?.srsCounts[s.key] ?? 0;
                const pct = data?.srsTotal ? Math.round((count / data.srsTotal) * 100) : 0;
                return (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium text-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
            {data?.srsTotal !== undefined && data.srsTotal > 0 && (
              <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50">
                <Trophy size={12} className="text-secondary" />
                {data.srsCounts.mastered} dari {data.srsTotal} kata dikuasai ({Math.round((data.srsCounts.mastered / data.srsTotal) * 100)}%)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly study activity */}
      <Card className="nori-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            Aktivitas Belajar (7 Hari Terakhir)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.weeklyChart ?? []).every((d) => d.minutes === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-8">Belum ada sesi belajar minggu ini. Mulai flashcard untuk melacak waktu belajarmu!</p>
          ) : (
            <ChartContainer config={{ minutes: { label: "Menit", color: "hsl(var(--primary))" } }} className="h-[160px] w-full">
              <BarChart data={data?.weeklyChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Exam score progression */}
      {(data?.examProgression ?? []).length > 0 && (
        <Card className="nori-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Progres Skor Ujian (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ score: { label: "Skor %", color: "hsl(var(--primary))" } }} className="h-[160px] w-full">
              <BarChart data={data?.examProgression ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Streak info */}
      <Card className="nori-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame size={16} className="text-destructive" />
            Streak Belajar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-serif font-bold text-foreground flex items-center justify-center gap-2">
                <Flame size={28} className="text-destructive" strokeWidth={1.75} />
                {data?.currentStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Streak saat ini</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-serif font-bold text-foreground flex items-center justify-center gap-2">
                <Trophy size={28} className="text-primary" strokeWidth={1.75} />
                {data?.longestStreak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Streak terpanjang</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">
                Progress menuju streak 30 hari
              </p>
              <Progress value={Math.min(((data?.currentStreak ?? 0) / 30) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.max(0, 30 - (data?.currentStreak ?? 0))} hari lagi menuju milestone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProgressPage;
