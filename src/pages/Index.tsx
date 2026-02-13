import WelcomeSection from "@/components/dashboard/WelcomeSection";
import DailyGoalCard from "@/components/dashboard/DailyGoalCard";
import DueReviewWidget from "@/components/dashboard/DueReviewWidget";
import RecentMaterials from "@/components/dashboard/RecentMaterials";
import StatsOverview from "@/components/dashboard/StatsOverview";
import LearningPathIndicator from "@/components/dashboard/LearningPathIndicator";
import DailyKanji from "@/components/DailyKanji";

const Index = () => {
  return (
    <>
      {/* Welcome */}
      <WelcomeSection />

      {/* Top row: Daily Goal + Due Reviews + Learning Path */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DailyGoalCard />
        <DueReviewWidget />
        <LearningPathIndicator />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsOverview />
      </div>

      {/* Recent Materials */}
      <div className="mb-8">
        <RecentMaterials />
      </div>

      {/* Daily Kanji */}
      <div className="max-w-sm">
        <DailyKanji />
      </div>
    </>
  );
};

export default Index;
