import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PracticeQuestion } from "@/hooks/usePractice";

interface PracticeSessionProps {
  questions: PracticeQuestion[];
  title: string;
  isLoading?: boolean;
  onComplete: (score: number, total: number, durationSeconds: number) => void;
  onExit: () => void;
}

const PracticeSession = ({ questions, title, isLoading, onComplete, onExit }: PracticeSessionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());

  if (isLoading) {
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat latihan...</p>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground">Tidak ada soal tersedia.</p>
          <Button variant="outline" onClick={onExit}>Kembali</Button>
        </CardContent>
      </Card>
    );
  }

  const current = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (showResult || finished) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === current.correct_answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      onComplete(score, questions.length, duration);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setShowResult(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-8 text-center space-y-4">
          <Trophy className="h-12 w-12 mx-auto text-primary" />
          <h3 className="text-xl font-serif font-bold">{title}</h3>
          <p className="text-2xl font-bold">{score}/{questions.length} ({pct}%)</p>
          <Button onClick={onExit} className="w-full">Selesai</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="nori-card max-w-lg mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-xs text-muted-foreground">{currentIndex + 1}/{questions.length}</span>
        </div>
        <Progress value={((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-jp text-lg leading-relaxed">{current.question_text}</p>
        <div className="space-y-2">
          {current.options.map((opt, idx) => {
            let extra = "";
            if (showResult) {
              if (idx === current.correct_answer) extra = "border-secondary bg-secondary/10";
              else if (idx === selected) extra = "border-destructive bg-destructive/10";
            }
            return (
              <Button
                key={idx}
                variant="outline"
                className={`w-full justify-start h-auto py-3 px-4 text-left font-normal ${extra}`}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
              >
                <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                {opt}
                {showResult && idx === current.correct_answer && <CheckCircle2 className="ml-auto h-4 w-4 text-secondary" />}
                {showResult && idx === selected && idx !== current.correct_answer && <XCircle className="ml-auto h-4 w-4 text-destructive" />}
              </Button>
            );
          })}
        </div>
        {showResult && current.explanation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            {current.explanation}
          </motion.div>
        )}
        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentIndex + 1 >= questions.length ? "Lihat Hasil" : "Berikutnya"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticeSession;
