import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewItem {
  japanese: string;
  reading: string;
  meaning: string;
  level: string;
  due: string;
}

const reviewItems: ReviewItem[] = [
  { japanese: "経験", reading: "けいけん", meaning: "experience", level: "N3", due: "Overdue" },
  { japanese: "届ける", reading: "とどける", meaning: "to deliver", level: "N3", due: "Due now" },
  { japanese: "予約", reading: "よやく", meaning: "reservation", level: "A2", due: "Due now" },
  { japanese: "相談", reading: "そうだん", meaning: "consultation", level: "N3", due: "In 30 min" },
  { japanese: "申し込む", reading: "もうしこむ", meaning: "to apply", level: "A2", due: "In 1 hour" },
];

const SRSReviewPanel = () => {
  const overdueCount = reviewItems.filter(
    (r) => r.due === "Overdue" || r.due === "Due now"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-semibold text-foreground">SRS Reviews</h2>
        {overdueCount > 0 && (
          <span className="srs-badge flex items-center gap-1 animate-pulse-soft">
            <AlertCircle size={12} />
            {overdueCount} due
          </span>
        )}
      </div>

      <div className="zen-card space-y-0 p-0 overflow-hidden">
        {reviewItems.map((item, i) => {
          const isOverdue = item.due === "Overdue";
          const isDueNow = item.due === "Due now";

          return (
            <motion.div
              key={item.japanese}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.3 + i * 0.05 }}
              className={`flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors duration-200 cursor-pointer ${
                isOverdue ? "bg-srs/5" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-xl font-jp font-medium text-foreground">{item.japanese}</p>
                  <p className="text-xs text-muted-foreground font-jp">{item.reading}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground">{item.meaning}</p>
                  <span className="text-xs text-muted-foreground">{item.level}</span>
                </div>
              </div>
              <span
                className={`text-xs font-medium ${
                  isOverdue
                    ? "text-srs"
                    : isDueNow
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {item.due}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          variant="default"
          className="gap-2"
        >
          <RotateCcw size={16} />
          Start Review Session
        </Button>
      </div>
    </motion.div>
  );
};

export default SRSReviewPanel;
