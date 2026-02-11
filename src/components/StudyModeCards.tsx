import { motion } from "framer-motion";
import { BookOpen, FileText, ArrowRight } from "lucide-react";

type StudyMode = "jlpt" | "jft";

interface StudyModeCardProps {
  mode: StudyMode;
  level: string;
  title: string;
  description: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  delay?: number;
}

const StudyModeCard = ({
  mode,
  level,
  title,
  description,
  progress,
  totalItems,
  completedItems,
  delay = 0,
}: StudyModeCardProps) => {
  const isJLPT = mode === "jlpt";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
      className="zen-card hover-lift cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              isJLPT ? "bg-jlpt-muted text-jlpt" : "bg-jft-muted text-jft"
            }`}
          >
            {isJLPT ? <BookOpen size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <span className={isJLPT ? "jlpt-badge" : "jft-badge"}>{level}</span>
          </div>
        </div>
        <ArrowRight
          size={18}
          className="text-muted-foreground group-hover:translate-x-1 transition-transform duration-300"
        />
      </div>

      <h3 className="text-lg font-serif font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedItems} / {totalItems} items</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: delay + 0.3 }}
            className={`h-full rounded-full ${isJLPT ? "bg-jlpt" : "bg-jft"}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const studyModes: StudyModeCardProps[] = [
  {
    mode: "jlpt",
    level: "N3",
    title: "JLPT N3 準備",
    description: "Intermediate grammar, kanji & vocabulary for the JLPT N3 exam.",
    progress: 42,
    totalItems: 650,
    completedItems: 273,
  },
  {
    mode: "jft",
    level: "A2",
    title: "JFT-Basic A2",
    description: "Practical Japanese for daily life and work in Japan.",
    progress: 68,
    totalItems: 320,
    completedItems: 218,
  },
];

const StudyModeCards = () => (
  <div>
    <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Study Modes</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {studyModes.map((mode, i) => (
        <StudyModeCard key={mode.level} {...mode} delay={i * 0.1} />
      ))}
    </div>
  </div>
);

export default StudyModeCards;
