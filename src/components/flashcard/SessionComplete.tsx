import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Zap, RotateCcw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SessionStats } from "@/hooks/useFlashcards";

interface SessionCompleteProps {
  stats: SessionStats;
  onRestart: () => void;
}

const SessionComplete = ({ stats, onRestart }: SessionCompleteProps) => {
  const navigate = useNavigate();
  const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;
  const timeMinutes = Math.round((Date.now() - stats.startTime) / 60000);
  const xpEarned = stats.correct * 10 + stats.incorrect * 2;
  const showConfetti = stats.reviewed >= 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="zen-card max-w-md mx-auto p-8 text-center space-y-6"
    >
      {showConfetti && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-6xl"
        >
          🎉
        </motion.div>
      )}

      <div>
        <Trophy className="mx-auto text-accent mb-3" size={48} />
        <h2 className="text-2xl font-serif font-bold text-foreground">Sesi Selesai!</h2>
        <p className="text-muted-foreground mt-1">Kerja bagus! Terus pertahankan!</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted rounded-xl p-4">
          <p className="text-3xl font-bold text-foreground">{stats.reviewed}</p>
          <p className="text-xs text-muted-foreground">Kartu Direview</p>
        </div>
        <div className="bg-muted rounded-xl p-4">
          <p className="text-3xl font-bold text-secondary">{accuracy}%</p>
          <p className="text-xs text-muted-foreground">Akurasi</p>
        </div>
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center justify-center gap-1">
            <Zap size={20} className="text-accent" />
            <p className="text-3xl font-bold text-accent">+{xpEarned}</p>
          </div>
          <p className="text-xs text-muted-foreground">XP Diperoleh</p>
        </div>
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center justify-center gap-1">
            <Flame size={20} className="text-destructive" />
            <p className="text-3xl font-bold text-destructive">{timeMinutes}</p>
          </div>
          <p className="text-xs text-muted-foreground">Menit</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRestart}>
          <RotateCcw size={16} /> Review Lagi
        </Button>
        <Button className="flex-1 gap-2" onClick={() => navigate("/")}>
          <Home size={16} /> Dashboard
        </Button>
      </div>
    </motion.div>
  );
};

export default SessionComplete;
