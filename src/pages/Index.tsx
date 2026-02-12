import { motion } from "framer-motion";
import StatsGrid from "@/components/StatsGrid";
import StudyModeCards from "@/components/StudyModeCards";
import SRSReviewPanel from "@/components/SRSReviewPanel";
import DailyKanji from "@/components/DailyKanji";

const Index = () => {
  return (
    <>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8"
      >
        <h1 className="text-3xl font-serif font-bold text-foreground">
          おはようございます 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready for today's study session? You have{" "}
          <span className="text-srs font-medium">3 reviews</span> waiting.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8">
        <StatsGrid />
      </div>

      {/* Study Modes */}
      <div className="mb-8">
        <StudyModeCards />
      </div>

      {/* Bottom grid: SRS + Daily Kanji */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SRSReviewPanel />
        </div>
        <div>
          <DailyKanji />
        </div>
      </div>
    </>
  );
};

export default Index;
