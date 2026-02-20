import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ClipboardCheck, BookOpen, Clock, ChevronRight, Target,
  TrendingUp, Award, Calendar, Languages, BarChart3, Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];
import { useState } from "react";

const chartConfig = {
  score: { label: "Skor", color: "hsl(var(--primary))" },
};

const weakAreas = [
  { area: "Grammar", percentage: 45, link: "/materials?category=grammar" },
  { area: "Reading", percentage: 60, link: "/materials?category=reading" },
  { area: "Vocabulary", percentage: 72, link: "/vocabulary" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function useExamHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exam-history", user?.id],
    queryFn: async () => {
      if (!user) return { results: [], progression: [] };
      const { data, error } = await supabase
        .from("exam_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      const results = (data ?? []).map((r) => ({
        id: r.id,
        type: r.exam_type === "jlpt" ? "JLPT" : "JFT",
        level: r.level.toUpperCase(),
        date: new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        score: r.score,
        total: r.total_questions,
        time: `${Math.round(r.time_taken_seconds / 60)} menit`,
        resultId: r.id,
      }));

      // Score progression (oldest to newest for chart)
      const progression = [...(data ?? [])]
        .reverse()
        .map((r) => ({
          date: new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          score: Math.round((r.score / r.total_questions) * 100),
        }));

      return { results, progression };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

const ExamSimulasi = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState("n5");
  const { data: examHistory, isLoading: historyLoading } = useExamHistory();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const pastResults = examHistory?.results ?? [];
  const scoreProgression = examHistory?.progression ?? [];
  const hasHistory = pastResults.length > 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={28} />
            Ujian Simulasi
          </h1>
          <p className="text-muted-foreground mt-1">
            Latih kemampuanmu dengan simulasi ujian resmi
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => navigate("/admin/questions")}>
            <Settings className="h-4 w-4 mr-2" />
            Kelola Soal
          </Button>
        )}
      </motion.div>

      {/* Exam Type Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* JLPT Card */}
        <motion.div variants={item}>
          <Card className="border-[hsl(var(--jlpt-muted))] bg-[hsl(var(--jlpt-muted)/0.3)] hover-lift overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--jlpt)/0.06)] rounded-bl-[80px]" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-jlpt flex items-center justify-center">
                  <BookOpen size={20} className="text-jlpt-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">JLPT Mock Test</CardTitle>
                  <CardDescription>Simulasi ujian JLPT resmi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {jlptLevels.map((level) => (
                  <Badge
                    key={level}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      selectedLevel === level.toLowerCase()
                        ? "bg-jlpt text-jlpt-foreground border-jlpt"
                        : "border-jlpt/30 text-jlpt hover:bg-jlpt hover:text-jlpt-foreground"
                    }`}
                    onClick={() => setSelectedLevel(level.toLowerCase())}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
              <Button
                className="w-full bg-jlpt text-jlpt-foreground hover:bg-jlpt/90"
                onClick={() => navigate(`/exam/jlpt/${selectedLevel}`)}
              >
                Mulai JLPT {selectedLevel.toUpperCase()}
                <ChevronRight size={16} />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* JFT Card */}
        <motion.div variants={item}>
          <Card className="border-[hsl(var(--jft-muted))] bg-[hsl(var(--jft-muted)/0.3)] hover-lift overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--jft)/0.06)] rounded-bl-[80px]" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-jft flex items-center justify-center">
                  <Languages size={20} className="text-jft-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">JFT Basic Mock Test</CardTitle>
                  <CardDescription>Simulasi JFT for Care Workers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-jft text-jft-foreground hover:bg-jft/90"
                onClick={() => navigate("/exam/jft")}
              >
                Mulai JFT
                <ChevronRight size={16} />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Past Results */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
          <Award size={20} className="text-accent" />
          Riwayat Ujian
        </h2>

        {historyLoading ? (
          <div className="zen-card p-8 text-center text-muted-foreground text-sm">Memuat riwayat...</div>
        ) : !hasHistory ? (
          <div className="zen-card p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-muted-foreground text-sm">Belum ada riwayat ujian. Mulai simulasi untuk melihat progresmu!</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-5">
            {/* Timeline */}
            <div className="lg:col-span-3 space-y-3">
              {pastResults.map((result, idx) => (
                <Card key={result.id} className="zen-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            result.type === "JLPT"
                              ? "bg-jlpt/10 text-jlpt"
                              : "bg-jft/10 text-jft"
                          }`}
                        >
                          <ClipboardCheck size={18} />
                        </div>
                        {idx < pastResults.length - 1 && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-3 bg-border" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {result.type} {result.level}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {result.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {result.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          result.score / result.total >= 0.75 ? "text-secondary" : result.score / result.total >= 0.5 ? "text-accent" : "text-destructive"
                        }`}>
                          {result.score}/{result.total}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/exam/results/${result.resultId}`)}>
                        Review
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Score Chart */}
            <div className="lg:col-span-2">
              <Card className="zen-card h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-primary" />
                    Progres Skor (%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <LineChart data={scoreProgression}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                      <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </motion.div>

      {/* Study Recommendations */}
      <motion.div variants={item}>
        <Card className="zen-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={18} className="text-accent" />
              Rekomendasi Belajar
            </CardTitle>
            <CardDescription>
              Fokus pada area yang perlu ditingkatkan berdasarkan hasil ujianmu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {weakAreas.map((area) => (
                <div
                  key={area.area}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{area.area}</p>
                      <span className={`text-xs font-bold ${
                        area.percentage >= 70 ? "text-secondary" : area.percentage >= 50 ? "text-accent" : "text-destructive"
                      }`}>
                        {area.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all ${
                          area.percentage >= 70 ? "bg-secondary" : area.percentage >= 50 ? "bg-accent" : "bg-destructive"
                        }`}
                        style={{ width: `${area.percentage}%` }}
                      />
                    </div>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                      <BarChart3 size={12} />
                      Latih {area.area}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ExamSimulasi;
