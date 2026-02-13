import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDueReviews } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Sekarang!");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}j ${m}m` : `${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <span className="flex items-center gap-1 text-xs text-srs">
      <Clock size={12} />
      {timeLeft}
    </span>
  );
};

const DueReviewWidget = () => {
  const { data: reviews = [] } = useDueReviews();
  const navigate = useNavigate();
  const count = reviews.length;
  const hasDue = count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
      className={`zen-card border-2 ${
        hasDue ? "border-srs bg-[hsl(var(--srs-alert)/0.05)]" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={18} className={hasDue ? "text-srs" : "text-muted-foreground"} />
        <h3 className="text-sm font-medium text-foreground">SRS Review</h3>
        {hasDue && (
          <span className="srs-badge text-[10px] animate-pulse-soft">{count}</span>
        )}
      </div>

      {hasDue ? (
        <>
          <p className="text-2xl font-serif font-bold text-foreground mb-1">
            {count} kartu
          </p>
          <p className="text-xs text-muted-foreground mb-2">menunggu review</p>
          {reviews[0] && (
            <CountdownTimer targetDate={reviews[0].next_review_date} />
          )}
          <Button
            className="mt-4 w-full gap-2 bg-srs hover:bg-srs/90 text-srs-foreground"
            onClick={() => navigate("/flashcards")}
          >
            Mulai Review
            <ArrowRight size={16} />
          </Button>
        </>
      ) : (
        <>
          <p className="text-lg font-serif font-semibold text-foreground mb-1">🎉 Semua selesai!</p>
          <p className="text-xs text-muted-foreground">Tidak ada review yang menunggu</p>
        </>
      )}
    </motion.div>
  );
};

export default DueReviewWidget;
