import { useNavigate } from "react-router-dom";
import { Sparkles, BookOpen, Layers, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDueReviews } from "@/hooks/useDashboardData";
import { useReviewPacks } from "@/hooks/useReviewPacks";
import { useStudyModeProgress } from "@/hooks/useLearningPath";
import { useWeakAreas } from "@/hooks/useWeakAreas";

const RecommendedToday = () => {
  const navigate = useNavigate();
  const { data: dueReviews = [] } = useDueReviews();
  const { data: reviewPacks = [] } = useReviewPacks();
  const { data: studyModes = [] } = useStudyModeProgress();
  const { data: weakAreas = [] } = useWeakAreas();

  const dueCount = dueReviews.length;
  const nextLessonPct = studyModes[0]?.progress ?? 0;
  const weakest = weakAreas[0];

  return (
    <Card className="nori-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 normal-case tracking-normal">
          <Sparkles size={16} className="text-primary" />
          Rekomendasi Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dueCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-md border border-primary/30 bg-card">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-foreground" />
              <span className="text-sm normal-case tracking-normal font-normal">{dueCount} flashcard due</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/flashcards")}>Review</Button>
          </div>
        )}

        {reviewPacks.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-foreground" />
              <span className="text-sm normal-case tracking-normal font-normal">Review pack dari ujian</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/practice?drill=grammar")}>Latih</Button>
          </div>
        )}

        {weakest && (
          <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-foreground" />
              <span className="text-sm normal-case tracking-normal font-normal">
                Perkuat {weakest.area} ({weakest.percentage}%)
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(weakest.link)}>Drill</Button>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
          <span className="text-sm normal-case tracking-normal font-normal">
            Progress jalur belajar: {nextLessonPct}%
          </span>
          <Button size="sm" onClick={() => navigate("/learn")}>Lanjutkan</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendedToday;
