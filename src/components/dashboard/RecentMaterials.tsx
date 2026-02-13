import { motion } from "framer-motion";
import { BookOpen, MessageCircle, FileText, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecentMaterials } from "@/hooks/useDashboardData";

const categoryConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  grammar: { icon: <FileText size={16} />, label: "Grammar" },
  reading: { icon: <BookOpen size={16} />, label: "Reading" },
  conversation: { icon: <MessageCircle size={16} />, label: "Conversation" },
  vocabulary: { icon: <Languages size={16} />, label: "Vocabulary" },
};

const RecentMaterials = () => {
  const { data: materials = [] } = useRecentMaterials();

  if (materials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Materi Terakhir</h2>
        <div className="zen-card text-center py-8">
          <p className="text-muted-foreground text-sm">Belum ada materi. Mulai belajar sekarang!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <h2 className="text-xl font-serif font-semibold text-foreground mb-4">Materi Terakhir</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((mat, i) => {
          const cfg = categoryConfig[mat.category] ?? categoryConfig.grammar;
          return (
            <motion.div
              key={mat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.08 }}
              className="zen-card hover-lift cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-muted text-foreground">
                  {cfg.icon}
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {cfg.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {mat.level.toUpperCase()}
                </Badge>
              </div>
              <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {mat.title}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-2">
                {new Date(mat.updated_at).toLocaleDateString("ja-JP")}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RecentMaterials;
