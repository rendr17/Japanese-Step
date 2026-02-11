import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const todayKanji = {
  character: "努",
  reading: "ど / つと(める)",
  meaning: "Effort, Endeavor",
  stroke: 7,
  example: "努力する (どりょくする) — to make an effort",
};

const DailyKanji = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
  >
    <div className="flex items-center gap-2 mb-4">
      <Sparkles size={18} className="text-accent" />
      <h2 className="text-xl font-serif font-semibold text-foreground">Today's Kanji</h2>
    </div>

    <div className="zen-card text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
        className="mb-4"
      >
        <span className="text-7xl font-serif text-foreground">{todayKanji.character}</span>
      </motion.div>

      <p className="text-sm font-jp text-muted-foreground mb-1">{todayKanji.reading}</p>
      <p className="text-lg font-semibold text-foreground mb-1">{todayKanji.meaning}</p>
      <p className="text-xs text-muted-foreground mb-4">{todayKanji.stroke} strokes</p>

      <div className="bg-muted rounded-lg p-3">
        <p className="text-sm font-jp text-foreground">{todayKanji.example}</p>
      </div>
    </div>
  </motion.div>
);

export default DailyKanji;
