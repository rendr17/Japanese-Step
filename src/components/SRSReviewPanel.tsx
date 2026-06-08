import { useNavigate } from "react-router-dom";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDueReviews } from "@/hooks/useDashboardData";
import { formatJlptLevel } from "@/lib/levelLabels";
import { cn } from "@/lib/utils";

const LevelBadge = ({ level }: { level: string | null | undefined }) => {
  const { label, variant } = formatJlptLevel(level);
  if (variant === "hidden") return null;
  return (
    <span className={cn("text-xs", variant === "jlpt" ? "jlpt-badge" : "jft-badge")}>
      {label}
    </span>
  );
};

const SRSReviewPanel = () => {
  const navigate = useNavigate();
  const { data: dueItems = [] } = useDueReviews();

  const displayItems = dueItems.slice(0, 5).map((item: any) => {
    const vocab = item.vocab_bank;
    return {
      japanese: vocab?.kanji || vocab?.kana || "?",
      reading: vocab?.kana ?? "",
      meaning: vocab?.meaning ?? "",
      level: vocab?.jlpt_level,
    };
  });

  const dueCount = displayItems.length;

  if (displayItems.length === 0) {
    return (
      <div>
        <p className="nori-jp-display text-2xl mb-1">復習</p>
        <h2 className="nori-section-title mb-4">SRS Reviews</h2>
        <div className="nori-card p-6 text-center text-sm text-muted-foreground normal-case tracking-normal font-normal">
          Tidak ada review due. Bagus!
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="nori-jp-display text-2xl mb-1">復習</p>
          <h2 className="nori-section-title">SRS Reviews</h2>
        </div>
        {dueCount > 0 && (
          <span className="srs-badge flex items-center gap-1">
            <AlertCircle size={12} />
            {dueCount} due
          </span>
        )}
      </div>

      <div className="nori-card space-y-0 p-0 overflow-hidden">
        {displayItems.map((item, i) => (
          <div
            key={`${item.japanese}-${i}`}
            className="flex items-center justify-between p-4 border-b border-border bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-center min-w-[60px] shrink-0">
                <p className="text-xl font-jp font-medium text-foreground">{item.japanese}</p>
                <p className="text-xs text-muted-foreground font-jp">{item.reading}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground normal-case tracking-normal font-normal truncate">
                  {item.meaning}
                </p>
                <LevelBadge level={item.level} />
              </div>
            </div>
          </div>
        ))}

        <div className="p-4 border-t border-border">
          <Button className="w-full gap-2" onClick={() => navigate("/flashcards")}>
            <RotateCcw size={16} />
            Start Review Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SRSReviewPanel;
