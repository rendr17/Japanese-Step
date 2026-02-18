import { Button } from "@/components/ui/button";
import { previewInterval } from "@/hooks/useFlashcards";
import { useEffect } from "react";

interface AnswerButtonsProps {
  onAnswer: (quality: number) => void;
  disabled: boolean;
  currentInterval: number;
  currentEase: number;
}

const buttons = [
  { quality: 0, label: "Lagi", key: "1", variant: "destructive" as const },
  { quality: 3, label: "Sulit", key: "2", className: "bg-orange-500 hover:bg-orange-600 text-white border-0" },
  { quality: 4, label: "Bagus", key: "3", className: "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-0" },
  { quality: 5, label: "Mudah", key: "4", className: "bg-primary hover:bg-primary/90 text-primary-foreground border-0" },
];

const AnswerButtons = ({ onAnswer, disabled, currentInterval, currentEase }: AnswerButtonsProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      const btn = buttons.find((b) => b.key === e.key);
      if (btn) onAnswer(btn.quality);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAnswer, disabled]);

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-lg mx-auto">
      {buttons.map((btn) => (
        <Button
          key={btn.quality}
          variant={btn.variant ?? "outline"}
          className={`flex flex-col h-auto py-3 px-2 gap-1 ${btn.className ?? ""}`}
          onClick={() => onAnswer(btn.quality)}
          disabled={disabled}
        >
          <span className="text-sm font-semibold">{btn.label}</span>
          <span className="text-[10px] opacity-80">
            {previewInterval(currentInterval, currentEase, btn.quality)}
          </span>
          <kbd className="text-[10px] opacity-50 border border-current/20 rounded px-1">{btn.key}</kbd>
        </Button>
      ))}
    </div>
  );
};

export default AnswerButtons;
