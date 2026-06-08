import WelcomeSection from "@/components/dashboard/WelcomeSection";
import DailyGoalCard from "@/components/dashboard/DailyGoalCard";
import DueReviewWidget from "@/components/dashboard/DueReviewWidget";
import RecentMaterials from "@/components/dashboard/RecentMaterials";
import StatsOverview from "@/components/dashboard/StatsOverview";
import LearningPathIndicator from "@/components/dashboard/LearningPathIndicator";
import DailyKanji from "@/components/DailyKanji";
import StudyModeCards from "@/components/StudyModeCards";
import DailyMissions from "@/components/dashboard/DailyMissions";
import SRSReviewPanel from "@/components/SRSReviewPanel";
import RecommendedToday from "@/components/dashboard/RecommendedToday";
import AchievementsPanel from "@/components/dashboard/AchievementsPanel";

const Index = () => {
  return (
    <>
      <WelcomeSection />

      <div className="mb-8">
        <StudyModeCards />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DueReviewWidget />
        <DailyGoalCard />
        <LearningPathIndicator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <DailyMissions />
        <RecommendedToday />
      </div>

      <div className="mb-8">
        <StatsOverview />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <RecentMaterials />
        <SRSReviewPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DailyKanji />
        <AchievementsPanel />
      </div>
    </>
  );
};

export default Index;
