import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { QuizQuestion } from "@/hooks/useMaterialProgress";

interface MaterialQuizProps {
  questions: QuizQuestion[];
  isLoading: boolean;
  onComplete: (score: number, total: number, answers: Array<{ questionIndex: number; selected: number; correct: boolean }>) => void;
  onClose: () => void;
}

const MaterialQuiz = ({ questions, isLoading, onComplete, onClose }: MaterialQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionIndex: number; selected: number; correct: boolean }>>([]);
  const [finished, setFinished] = useState(false);

  if (isLoading) {
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Menyiapkan kuis dari materi...</p>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">Gagal membuat kuis. Coba lagi nanti.</p>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </CardContent>
      </Card>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  const handleSelect = (idx: number) => {
    if (showResult || finished) return;
    setSelected(idx);
    setShowResult(true);
    const correct = idx === current.correct_answer;
    if (correct) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { questionIndex: currentIndex, selected: idx, correct }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      onComplete(score, questions.length, answers);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setShowResult(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <Card className="nori-card max-w-lg mx-auto">
        <CardContent className="py-8 text-center space-y-4">
          <Trophy className={`h-12 w-12 mx-auto ${passed ? "text-secondary" : "text-accent"}`} />
          <h3 className="text-xl font-serif font-bold">{passed ? "Selamat!" : "Terus Latihan!"}</h3>
          <p className="text-2xl font-bold">{score}/{questions.length} ({pct}%)</p>
          <p className="text-sm text-muted-foreground">
            {passed ? "Materi ditandai selesai. XP ditambahkan!" : "Skor minimal 70% untuk menyelesaikan materi."}
          </p>
          <Button onClick={onClose} className="w-full">Kembali ke Materi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="nori-card max-w-lg mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Latihan Materi</CardTitle>
          <span className="text-xs text-muted-foreground">{currentIndex + 1}/{questions.length}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-jp text-lg leading-relaxed">{current.question_text}</p>
        <div className="space-y-2">
          {current.options.map((opt, idx) => {
            let variant = "outline" as const;
            let extra = "";
            if (showResult) {
              if (idx === current.correct_answer) extra = "border-secondary bg-secondary/10";
              else if (idx === selected) extra = "border-destructive bg-destructive/10";
            } else if (selected === idx) extra = "border-primary";

            return (
              <Button
                key={idx}
                variant={variant}
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
        {showResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-1">Penjelasan</p>
            <p className="text-muted-foreground">{current.explanation}</p>
          </motion.div>
        )}
        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentIndex + 1 >= questions.length ? "Lihat Hasil" : "Soal Berikutnya"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialQuiz;
