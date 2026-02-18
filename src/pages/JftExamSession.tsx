import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag, ChevronRight, ChevronLeft, Clock, Send, X,
  Pause, Play, Volume2, VolumeX, Eye, MessageSquare,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useJftQuestions, JftQuestion, JFT_SECTIONS } from "@/hooks/useJftQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TOTAL_TIME = 60 * 60; // 60 minutes

interface AnswerState {
  selected: number | null;
  flagged: boolean;
}

const JftExamSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: questions, isLoading } = useJftQuestions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [paused, setPaused] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(true);
  const [showTranscript, setShowTranscript] = useState<Record<number, boolean>>({});
  const [audioPlays, setAudioPlays] = useState<Record<number, number>>({});
  const timeWarningShown = useRef(false);
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);

  // Timer
  useEffect(() => {
    if (submitted || paused) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
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
  }, [submitted, paused]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (submitted || paused) return;
      if (e.key >= "1" && e.key <= "4") selectAnswer(parseInt(e.key) - 1);
      if (e.key === "Enter" && currentIndex < (questions?.length || 0) - 1) setCurrentIndex((i) => i + 1);
      if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, questions, submitted, paused]);

  // Sync active section with current index
  useEffect(() => {
    const sectionIndex = Math.floor(currentIndex / 10);
    if (sectionIndex !== activeSection) setActiveSection(sectionIndex);
  }, [currentIndex]);

  const selectAnswer = useCallback((optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: optionIndex, flagged: prev[currentIndex]?.flagged || false },
    }));
  }, [currentIndex]);

  const toggleFlag = useCallback(() => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: prev[currentIndex]?.selected ?? null, flagged: !prev[currentIndex]?.flagged },
    }));
  }, [currentIndex]);

  const handlePlayAudio = useCallback((index: number) => {
    const plays = audioPlays[index] || 0;
    if (plays >= 2) {
      toast({ title: "Batas replay", description: "Audio hanya bisa diputar maksimal 2 kali", variant: "destructive" });
      return;
    }
    setAudioPlays((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    toast({ title: "🔊 Audio diputar", description: `Putar ke-${plays + 1} dari 2` });
  }, [audioPlays, toast]);

  const handleSubmit = useCallback(async () => {
    if (submitted || !questions || !user) return;
    setSubmitted(true);

    const timeTaken = Math.round((Date.now() - startTime.current - pausedTime.current) / 1000);
    let score = 0;
    const answerData = questions.map((q, i) => {
      const selected = answers[i]?.selected ?? null;
      const correct = selected === q.correct_answer;
      if (correct) score++;
      return { question_id: q.id, selected, correct_answer: q.correct_answer, correct, section: q.section };
    });

    const { data, error } = await supabase.from("exam_results").insert({
      user_id: user.id,
      exam_type: "jft",
      level: "basic",
      score,
      total_questions: questions.length,
      answers: answerData,
      time_taken_seconds: timeTaken,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "Gagal menyimpan hasil", variant: "destructive" });
      return;
    }
    navigate(`/exam/results/${data.id}`);
  }, [submitted, questions, answers, user, navigate, toast]);

  if (isLoading || !questions) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "hsl(var(--jft))" }} />
          <p className="text-muted-foreground">Memuat soal JFT...</p>
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
  const isConversation = currentQuestion.section === "conversation";
  const isSituational = currentQuestion.section === "situational";
  const fontSize = largeFont ? "text-lg sm:text-xl" : "text-base sm:text-lg";

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${highContrast ? "bg-white text-black" : "bg-background"}`}>
      {/* Pause Overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/95 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <Pause size={64} className="text-muted-foreground mx-auto" />
              <h2 className="text-2xl font-serif font-bold text-foreground">Ujian Di-Pause</h2>
              <p className="text-muted-foreground">Tekan Space atau klik tombol di bawah untuk melanjutkan</p>
              <Button
                onClick={() => setPaused(false)}
                className="bg-jft text-jft-foreground hover:bg-jft/90"
              >
                <Play size={18} />
                Lanjutkan Ujian
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          {JFT_SECTIONS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => { setActiveSection(i); setCurrentIndex(i * 10); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeSection === i
                  ? "bg-jft text-jft-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.icon}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPaused(true)} title="Pause (Space)">
            <Pause size={16} />
          </Button>
          <div className={`flex items-center gap-1.5 font-mono text-sm font-bold px-2 py-1 rounded ${
            isTimeLow ? "text-accent bg-accent/10 animate-pulse" : "text-foreground"
          }`}>
            <Clock size={14} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <Button
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setLargeFont(!largeFont)}
            title="Toggle font size"
          >
            <Eye size={16} />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Progress value={(answeredCount / questions.length) * 100} className="h-1.5 rounded-none" />

      <div className="flex flex-1 overflow-hidden">
        {/* Question Area */}
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
                  className="space-y-6"
                >
                  {/* Section & Question Number */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-[hsl(var(--jft)/0.3)] text-xs">
                      {JFT_SECTIONS[activeSection]?.label}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {currentIndex + 1} / {questions.length}
                    </Badge>
                  </div>

                  {/* Scenario badge for situational */}
                  {isSituational && currentQuestion.scenario && (
                    <div className="p-3 rounded-lg bg-[hsl(var(--jft)/0.08)] border border-[hsl(var(--jft)/0.2)] text-sm text-foreground">
                      <p className="font-medium mb-1" style={{ color: "hsl(var(--jft))" }}>📋 Situasi:</p>
                      <p className="text-muted-foreground">{currentQuestion.scenario}</p>
                    </div>
                  )}

                  {/* Audio controls for conversation */}
                  {isConversation && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--jft)/0.08)] border border-[hsl(var(--jft)/0.2)]">
                      <Button
                        size="sm"
                        onClick={() => handlePlayAudio(currentIndex)}
                        disabled={(audioPlays[currentIndex] || 0) >= 2}
                        className="bg-jft text-jft-foreground hover:bg-jft/90"
                      >
                        <Volume2 size={14} />
                        Play Audio
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {(audioPlays[currentIndex] || 0)}/2 replay
                      </span>
                      {currentAnswer?.selected !== null && currentAnswer?.selected !== undefined && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setShowTranscript((p) => ({ ...p, [currentIndex]: !p[currentIndex] }))}
                          className="ml-auto text-xs"
                        >
                          <MessageSquare size={14} />
                          {showTranscript[currentIndex] ? "Sembunyikan" : "Lihat"} Transkrip
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Transcript */}
                  {isConversation && showTranscript[currentIndex] && currentQuestion.transcript && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-jp whitespace-pre-line text-muted-foreground">
                      {currentQuestion.transcript}
                    </div>
                  )}

                  {/* Question */}
                  <p className={`font-serif leading-relaxed text-foreground ${fontSize}`}>
                    {currentQuestion.question_text}
                  </p>

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
                            largeFont ? "text-base" : "text-sm"
                          } ${
                            isSelected
                              ? "border-[hsl(var(--jft))] bg-[hsl(var(--jft)/0.05)]"
                              : "border-border hover:border-[hsl(var(--jft)/0.3)] hover:bg-muted/30"
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                            isSelected
                              ? "bg-jft text-jft-foreground"
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
                variant="outline" size="sm"
                onClick={toggleFlag}
                className={currentAnswer?.flagged ? "text-accent border-accent" : ""}
              >
                <Flag size={14} />
                {currentAnswer?.flagged ? "Ditandai" : "Tandai"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={14} /> Prev
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button
                  size="sm" onClick={() => setCurrentIndex((i) => i + 1)}
                  className="bg-jft text-jft-foreground hover:bg-jft/90"
                >
                  Next <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  size="sm" onClick={() => setShowSubmitDialog(true)}
                  className="bg-secondary text-secondary-foreground"
                >
                  <Send size={14} /> Submit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Answer Sheet Panel (sticky right) */}
        <div className="hidden lg:block w-64 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Lembar Jawaban</p>

            <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border" /> Belum</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-jft" /> Dijawab</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent" /> Ditandai</span>
            </div>

            {JFT_SECTIONS.map((section, si) => (
              <div key={section.key}>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-jft/10 flex items-center justify-center text-[10px] font-bold" style={{ color: "hsl(var(--jft))" }}>
                    {section.icon}
                  </span>
                  {section.label}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: section.count }, (_, i) => {
                    const qi = si * 10 + i;
                    const ans = answers[qi];
                    const isCurrent = qi === currentIndex;
                    const answered = ans?.selected !== null && ans?.selected !== undefined;
                    const flagged = ans?.flagged;
                    return (
                      <button
                        key={qi}
                        onClick={() => setCurrentIndex(qi)}
                        className={`w-full aspect-square rounded text-xs font-medium transition-all ${
                          isCurrent ? "ring-2 ring-offset-1" : ""
                        } ${isCurrent ? "ring-[hsl(var(--jft))]" : ""} ${
                          flagged
                            ? "bg-accent text-accent-foreground"
                            : answered
                            ? "bg-jft text-jft-foreground"
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
              <p className="text-xs text-muted-foreground">{answeredCount}/{questions.length} dijawab</p>
              <Button
                size="sm" variant="outline" className="w-full"
                onClick={() => setShowSubmitDialog(true)}
              >
                <Send size={14} /> Submit Ujian
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Ujian JFT?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Anda akan mengakhiri ujian ini.</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-jft" /> {answeredCount} dijawab</span>
                <span className="flex items-center gap-1"><Flag size={14} className="text-accent" /> {flaggedCount} ditandai</span>
              </div>
              {answeredCount < questions.length && (
                <p className="text-accent font-medium text-sm">⚠️ {questions.length - answeredCount} soal belum dijawab!</p>
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
              <AlertTriangle size={20} /> Peringatan Waktu
            </AlertDialogTitle>
            <AlertDialogDescription>Sisa waktu tinggal 10 menit!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JftExamSession;
