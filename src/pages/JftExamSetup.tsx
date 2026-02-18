import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages, Clock, FileText, AlertTriangle, ChevronRight,
  HeartPulse, Volume2, Pause, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JFT_SECTIONS } from "@/hooks/useJftQuestions";

const JftExamSetup = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleStart = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          navigate("/exam/jft/start");
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
            <span className="text-8xl font-serif font-bold" style={{ color: "hsl(var(--jft))" }}>
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
        <Badge className="bg-jft text-jft-foreground mb-3">JFT Basic</Badge>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <HeartPulse size={24} className="text-jft" />
          JFT Basic Mock Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Simulasi ujian JFT for Care Workers
        </p>
      </div>

      <Card className="zen-card border-[hsl(var(--jft-muted))]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText size={20} style={{ color: "hsl(var(--jft))" }} />
            Instruksi Ujian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--jft-muted)/0.3)]">
              <FileText size={18} style={{ color: "hsl(var(--jft))" }} />
              <div>
                <p className="text-sm font-medium text-foreground">Total Soal</p>
                <p className="text-lg font-bold" style={{ color: "hsl(var(--jft))" }}>40</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--jft-muted)/0.3)]">
              <Clock size={18} style={{ color: "hsl(var(--jft))" }} />
              <div>
                <p className="text-sm font-medium text-foreground">Waktu</p>
                <p className="text-lg font-bold" style={{ color: "hsl(var(--jft))" }}>60 menit</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Bagian Ujian:</p>
            <div className="space-y-1.5">
              {JFT_SECTIONS.map((s) => (
                <div key={s.key} className="flex items-center justify-between p-2.5 rounded bg-[hsl(var(--jft-muted)/0.2)] text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-jft text-jft-foreground flex items-center justify-center text-xs font-bold">
                      {s.icon}
                    </span>
                    <span className="text-foreground">{s.label}</span>
                  </div>
                  <span className="text-muted-foreground">{s.count} soal</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Fitur Khusus JFT:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Volume2 size={14} />, label: "Audio Listening" },
                { icon: <Pause size={14} />, label: "Pause & Resume" },
                { icon: <Eye size={14} />, label: "Font Besar" },
                { icon: <Languages size={14} />, label: "Konteks Care Worker" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground">
                  {f.icon}
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--jft)/0.08)] border border-[hsl(var(--jft)/0.2)]">
            <AlertTriangle size={18} style={{ color: "hsl(var(--jft))" }} className="mt-0.5 shrink-0" />
            <div className="text-sm text-foreground space-y-1">
              <p className="font-medium">Perbedaan dengan JLPT:</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                <li>Ujian bisa di-pause dan di-resume</li>
                <li>Bagian Conversation memiliki audio (max 2x replay)</li>
                <li>Passing score: <strong>70%</strong></li>
                <li>Font lebih besar untuk kemudahan membaca</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/exam")}>
          Kembali
        </Button>
        <Button
          className="flex-1 bg-jft text-jft-foreground hover:bg-jft/90"
          onClick={handleStart}
        >
          <Languages size={18} />
          Mulai Ujian JFT
          <ChevronRight size={16} />
        </Button>
      </div>
    </motion.div>
  );
};

export default JftExamSetup;
