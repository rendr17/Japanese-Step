import { AlertCircle, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDueReviews } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
    <span className="flex items-center gap-1 text-xs text-primary normal-case tracking-normal font-medium">
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
    <div
      className={cn(
        "nori-card border-2",
        hasDue ? "border-primary/35" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={18} className={hasDue ? "text-primary" : "text-muted-foreground"} />
        <h3 className="nori-section-title normal-case">SRS Review</h3>
        {hasDue && <span className="srs-badge text-[10px]">{count}</span>}
      </div>

      {hasDue ? (
        <>
          <p className="text-2xl font-bold text-foreground mb-1 normal-case tracking-normal">
            {count} kartu
          </p>
          <p className="text-xs text-muted-foreground mb-2 normal-case tracking-normal font-normal">
            menunggu review
          </p>
          {reviews[0] && <CountdownTimer targetDate={reviews[0].next_review_date} />}
          <Button className="mt-4 w-full gap-2" onClick={() => navigate("/flashcards")}>
            Mulai Review
            <ArrowRight size={16} />
          </Button>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-foreground mb-1 normal-case tracking-normal">Semua selesai!</p>
          <p className="text-xs text-muted-foreground normal-case tracking-normal font-normal">
            Tidak ada review yang menunggu
          </p>
        </>
      )}
    </div>
  );
};

export default DueReviewWidget;
