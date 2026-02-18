import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Trophy, Clock, Target,
  RotateCcw, ArrowLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ExamResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showReview, setShowReview] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["exam-result", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_results")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const answers = result.answers as any[];
  const percentage = Math.round((result.score / result.total_questions) * 100);
  const passed = percentage >= 60;
  const minutes = Math.floor(result.time_taken_seconds / 60);
  const seconds = result.time_taken_seconds % 60;

  // Section breakdown
  const sections = ["vocabulary", "grammar", "reading"];
  const sectionLabels: Record<string, string> = { vocabulary: "Vocabulary", grammar: "Grammar", reading: "Reading" };
  const sectionData = sections.map((s) => {
    const sectionAnswers = answers.filter((a) => a.section === s);
    const correct = sectionAnswers.filter((a) => a.correct).length;
    return { section: sectionLabels[s], correct, total: sectionAnswers.length, pct: sectionAnswers.length ? Math.round((correct / sectionAnswers.length) * 100) : 0 };
  });

  const chartConfig = {
    correct: { label: "Benar", color: "hsl(var(--secondary))" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Score Header */}
      <Card className={`zen-card text-center ${passed ? "border-secondary/30" : "border-accent/30"}`}>
        <CardContent className="pt-8 pb-6 space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Trophy size={48} className={passed ? "text-secondary mx-auto" : "text-accent mx-auto"} />
          </motion.div>

          <div>
            <Badge className={passed ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}>
              {passed ? "LULUS" : "BELUM LULUS"}
            </Badge>
          </div>

          <div>
            <p className="text-5xl font-serif font-bold text-foreground">
              {result.score}/{result.total_questions}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: passed ? "hsl(var(--secondary))" : "hsl(var(--accent))" }}>
              {percentage}%
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Target size={14} />
              JLPT {result.level.toUpperCase()}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {minutes}m {seconds}s
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="zen-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Breakdown per Bagian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionData.map((s) => (
              <div key={s.section} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{s.section}</span>
                  <span className="text-muted-foreground">{s.correct}/{s.total} ({s.pct}%)</span>
                </div>
                <Progress value={s.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="zen-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Akurasi per Bagian</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={sectionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="section" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="Akurasi (%)">
                  {sectionData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct >= 60 ? "hsl(var(--secondary))" : "hsl(var(--accent))"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Review Answers */}
      <Card className="zen-card">
        <CardHeader>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between"
            onClick={() => setShowReview(!showReview)}
          >
            <CardTitle className="text-sm">Review Jawaban</CardTitle>
            {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </CardHeader>
        {showReview && (
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${
                  a.correct ? "border-secondary/30 bg-secondary/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {a.correct ? (
                    <CheckCircle2 size={16} className="text-secondary mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Soal {i + 1} <span className="text-muted-foreground font-normal">({a.section})</span></p>
                    <p className="text-muted-foreground mt-1">
                      Jawaban: {a.selected !== null ? ["A", "B", "C", "D"][a.selected] : "Tidak dijawab"} 
                      {!a.correct && ` → Benar: ${["A", "B", "C", "D"][a.correct_answer]}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/exam")}>
          <ArrowLeft size={16} />
          Dashboard
        </Button>
        <Button
          className="flex-1 bg-jlpt text-jlpt-foreground hover:bg-jlpt/90"
          onClick={() => navigate(`/exam/jlpt/${result.level}`)}
        >
          <RotateCcw size={16} />
          Ujian Ulang
        </Button>
      </div>
    </motion.div>
  );
};

export default ExamResults;
