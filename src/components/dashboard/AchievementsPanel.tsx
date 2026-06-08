import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function isEmojiIcon(icon: string | null | undefined): boolean {
  if (!icon) return true;
  return [...icon].length <= 2;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { all: [], earned: [] };

      const { data: all } = await supabase.from("achievements" as any).select("*");
      const { data: earned } = await supabase
        .from("user_achievements" as any)
        .select("*, achievements(*)")
        .eq("user_id", user.id);

      return { all: all ?? [], earned: earned ?? [] };
    },
    staleTime: 5 * 60 * 1000,
  });
}

const AchievementsPanel = () => {
  const { data } = useAchievements();
  const earnedIds = new Set((data?.earned ?? []).map((e: any) => e.achievement_id));

  return (
    <Card className="nori-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm normal-case tracking-normal">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(data?.all ?? []).map((ach: any) => {
            const unlocked = earnedIds.has(ach.id);
            return (
              <div
                key={ach.id}
                className={cn(
                  "p-3 rounded-md border text-center",
                  unlocked ? "border-primary bg-card" : "border-border opacity-50",
                )}
                title={ach.description}
              >
                {isEmojiIcon(ach.icon) ? (
                  <Trophy size={20} className="mx-auto text-primary" strokeWidth={1.75} />
                ) : (
                  <span className="text-lg block">{ach.icon}</span>
                )}
                <p className="text-xs font-medium mt-1 truncate normal-case tracking-normal">{ach.title}</p>
                {unlocked && (
                  <Badge variant="outline" className="text-[9px] mt-1">Earned</Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;
