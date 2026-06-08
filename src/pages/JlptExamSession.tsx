import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag, ChevronRight, ChevronLeft, Clock, Grid3X3,
  AlertTriangle, CheckCircle2, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useExamQuestions, ExamQuestion } from "@/hooks/useExamQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStudySession } from "@/hooks/useStudySession";
import { useAddXP } from "@/hooks/useDailyXP";

const TOTAL_TIME = 90 * 60; // 90 minutes in seconds

interface AnswerState {
  selected: number | null;
  flagged: boolean;
}

const JlptExamSession = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: questions, isLoading } = useExamQuestions(level || "n5");
  const { startSession, endSession } = useStudySession();
  const addXP = useAddXP();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [showNav, setShowNav] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeWarningShown = useRef(false);
  const startTime = useRef(Date.now());
  const handleSubmitRef = useRef<() => void>(() => {});

  const handleSubmit = useCallback(async () => {
    if (submitted || isSubmitting || !questions || !user) return;
    setIsSubmitting(true);

    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    let score = 0;
    const answerData = questions.map((q, i) => {
      const selected = answers[i]?.selected ?? null;
      const correct = selected === q.correct_answer;
      if (correct) score++;
      return {
        question_id: q.id,
        selected,
        correct_answer: q.correct_answer,
        correct,
        section: q.section,
      };
    });

    const { data, error } = await supabase.from("exam_results").insert({
      user_id: user.id,
      exam_type: "jlpt",
      level: level || "n5",
      score,
      total_questions: questions.length,
      answers: answerData,
      time_taken_seconds: timeTaken,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "Gagal menyimpan hasil ujian", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const xp = Math.round((score / questions.length) * 50);
    if (xp > 0) {
      addXP.mutate({ xp, activityType: "exam" });
    }
    await endSession(xp);

    setSubmitted(true);
    navigate(`/exam/results/${data.id}`);
  }, [submitted, isSubmitting, questions, answers, user, level, navigate, toast, addXP, endSession]);

  useEffect(() => {
    handleSubmitRef.current = () => { void handleSubmit(); };
  }, [handleSubmit]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      startSession("exam_jlpt");
    }
  }, [questions, startSession]);

  // Timer
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitRef.current();
          return 0;
        }
        if (prev === 600 && !timeWarningShown.current) {
          timeWarningShown.current = true;
          setShowTimeWarning(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (submitted) return;
      if (e.key >= "1" && e.key <= "4") {
        selectAnswer(parseInt(e.key) - 1);
      }
      if (e.key === "Enter") {
        if (currentIndex < (questions?.length || 0) - 1) {
          setCurrentIndex((i) => i + 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, questions, submitted]);

  const selectAnswer = useCallback((optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { ...prev[currentIndex], selected: optionIndex, flagged: prev[currentIndex]?.flagged || false },
    }));
  }, [currentIndex]);

  const toggleFlag = useCallback(() => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: prev[currentIndex]?.selected ?? null, flagged: !prev[currentIndex]?.flagged },
    }));
  }, [currentIndex]);

  if (isLoading || !questions) {
    return (
      <div className="fixed inset-0 z-50 bg-canvas flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Memuat soal...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const answeredCount = Object.values(answers).filter((a) => a.selected !== null).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeLow = timeLeft < 600;

  const currentSection = currentIndex < 20 ? "Vocabulary" : currentIndex < 40 ? "Grammar" : "Reading";

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col p-2">
      {/* Top Bar */}
      <div className="border-2 border-primary rounded-t-lg px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs">
            {currentIndex + 1} / {questions.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentSection}
          </Badge>
        </div>

        <Progress value={(answeredCount / questions.length) * 100} className="flex-1 mx-6 h-2 max-w-xs" />

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${isTimeLow ? "text-accent animate-pulse" : "text-foreground"}`}>
            <Clock size={16} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowNav(!showNav)} className="relative">
            <Grid3X3 size={18} />
            {flaggedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center">
                {flaggedCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12">
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Question */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                      Soal {currentIndex + 1}
                    </p>
                    <p className="text-lg sm:text-xl font-serif leading-relaxed text-foreground">
                      {currentQuestion.question_text}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, oi) => {
                      const isSelected = currentAnswer?.selected === oi;
                      const labels = ["A", "B", "C", "D"];
                      return (
                        <button
                          key={oi}
                          onClick={() => selectAnswer(oi)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {labels[oi]}
                          </span>
                          <span className="font-jp text-foreground">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFlag}
                className={currentAnswer?.flagged ? "text-accent border-accent" : ""}
              >
                <Flag size={14} />
                {currentAnswer?.flagged ? "Ditandai" : "Tandai"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={14} />
                Prev
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="bg-primary text-primary-foreground"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSubmitDialog(true)}
                  className="bg-secondary text-secondary-foreground"
                >
                  <Send size={14} />
                  Submit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <AnimatePresence>
          {showNav && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Navigasi Soal</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNav(false)}>
                    <X size={14} />
                  </Button>
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border" /> Belum</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> Dijawab</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent" /> Ditandai</span>
                </div>

                {["Vocabulary", "Grammar", "Reading"].map((section, si) => (
                  <div key={section}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{section}</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 20 }, (_, i) => {
                        const qi = si * 20 + i;
                        const ans = answers[qi];
                        const isCurrent = qi === currentIndex;
                        const answered = ans?.selected !== null && ans?.selected !== undefined;
                        const flagged = ans?.flagged;
                        return (
                          <button
                            key={qi}
                            onClick={() => setCurrentIndex(qi)}
                            className={`w-full aspect-square rounded text-xs font-medium transition-all ${
                              isCurrent
                                ? "ring-2 ring-primary ring-offset-1"
                                : ""
                            } ${
                              flagged
                                ? "bg-accent text-accent-foreground"
                                : answered
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {qi + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {answeredCount}/{questions.length} dijawab
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowSubmitDialog(true)}
                  >
                    <Send size={14} />
                    Submit Ujian
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Ujian?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan mengakhiri ujian ini.</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-primary" /> {answeredCount} dijawab
                </span>
                <span className="flex items-center gap-1">
                  <Flag size={14} className="text-accent" /> {flaggedCount} ditandai
                </span>
              </div>
              {answeredCount < questions.length && (
                <p className="text-accent font-medium text-sm flex items-center gap-1.5">
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  {questions.length - answeredCount} soal belum dijawab!
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lanjut Ujian</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Ya, Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Warning */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-accent">
              <AlertTriangle size={20} />
              Peringatan Waktu
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sisa waktu tinggal 10 menit! Pastikan semua soal sudah dijawab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JlptExamSession;
