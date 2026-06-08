import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, FileText, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecentMaterials } from "@/hooks/useDashboardData";
import { formatJlptLevel } from "@/lib/levelLabels";
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  grammar: { icon: <FileText size={16} strokeWidth={1.75} />, label: "Grammar" },
  reading: { icon: <BookOpen size={16} strokeWidth={1.75} />, label: "Reading" },
  conversation: { icon: <MessageCircle size={16} strokeWidth={1.75} />, label: "Conversation" },
  vocabulary: { icon: <Languages size={16} strokeWidth={1.75} />, label: "Vocabulary" },
};

const LevelBadge = ({ level }: { level: string }) => {
  const { label, variant } = formatJlptLevel(level);
  if (variant === "hidden") return null;
  return (
    <span className={cn("text-[10px] shrink-0", variant === "jlpt" ? "jlpt-badge" : "jft-badge")}>
      {label}
    </span>
  );
};

const RecentMaterials = () => {
  const { data: materials = [] } = useRecentMaterials();

  return (
    <div>
      <p className="nori-jp-display text-2xl mb-1">教材</p>
      <h2 className="nori-section-title mb-4">Materi Terakhir</h2>

      {materials.length === 0 ? (
        <div className="nori-card text-center py-8">
          <p className="text-muted-foreground text-sm normal-case tracking-normal font-normal">
            Belum ada materi. Mulai belajar sekarang!
          </p>
        </div>
      ) : (
        <div className="nori-card space-y-0 p-0 overflow-hidden">
          {materials.map((mat) => {
            const cfg = categoryConfig[mat.category] ?? categoryConfig.grammar;
            return (
              <Link
                key={mat.id}
                to={`/materials/${mat.id}`}
                className={cn(
                  "flex items-center gap-3 p-4 border-b border-border last:border-b-0",
                  "hover:bg-muted transition-colors group",
                )}
              >
                <div className="p-2 border border-border rounded-md text-foreground shrink-0">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {cfg.label}
                    </Badge>
                    <LevelBadge level={mat.level} />
                  </div>
                  <p className="font-medium text-sm text-foreground truncate normal-case tracking-normal group-hover:text-primary transition-colors">
                    {mat.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 normal-case">
                  {new Date(mat.updated_at).toLocaleDateString("ja-JP")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentMaterials;
