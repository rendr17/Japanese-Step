import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const JlptExamSetup = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);

  const displayLevel = (level || "n5").toUpperCase();

  const handleStart = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          navigate(`/exam/jlpt/${level}/start`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <span className="text-8xl font-serif font-bold text-primary">
              {countdown}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <Badge className="bg-jlpt text-jlpt-foreground mb-3">{displayLevel}</Badge>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          JLPT {displayLevel} Mock Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Simulasi ujian JLPT resmi level {displayLevel}
        </p>
      </div>

      <Card className="zen-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Instruksi Ujian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Total Soal</p>
                <p className="text-lg font-bold text-primary">60</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Waktu</p>
                <p className="text-lg font-bold text-primary">90 menit</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Bagian Ujian:</p>
            <div className="space-y-1.5">
              {[
                { label: "Vocabulary (語彙)", count: 20 },
                { label: "Grammar (文法)", count: 20 },
                { label: "Reading (読解)", count: 20 },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{s.count} soal</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
            <AlertTriangle size={18} className="text-accent mt-0.5 shrink-0" />
            <div className="text-sm text-foreground space-y-1">
              <p className="font-medium">Perhatian:</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                <li>Ujian tidak bisa di-pause</li>
                <li>Jawaban otomatis dikumpulkan saat waktu habis</li>
                <li>Anda bisa menandai soal untuk di-review</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/exam")}>
          Kembali
        </Button>
        <Button className="flex-1 bg-jlpt text-jlpt-foreground hover:bg-jlpt/90" onClick={handleStart}>
          <BookOpen size={18} />
          Mulai Ujian
          <ChevronRight size={16} />
        </Button>
      </div>
    </motion.div>
  );
};

export default JlptExamSetup;
