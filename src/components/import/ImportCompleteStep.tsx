import { motion } from "framer-motion";
import { CheckCircle2, BookOpen, List, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  materialCount: number;
  vocabCount: number;
  firstMaterialId?: string;
  onNavigate: (path: string) => void;
}

const ImportCompleteStep = ({ materialCount, vocabCount, firstMaterialId, onNavigate }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-8 space-y-6"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Import Selesai! 🎉</h2>
        <p className="text-muted-foreground">Materi belajar berhasil diimpor dan disusun rapi.</p>
      </div>

      <Card className="p-6 w-full max-w-sm">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">{materialCount}</p>
            <p className="text-xs text-muted-foreground">Materi Dibuat</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{vocabCount}</p>
            <p className="text-xs text-muted-foreground">Kosakata Disimpan</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {firstMaterialId && (
          <Button className="flex-1 gap-2" onClick={() => onNavigate(`/materials/${firstMaterialId}`)}>
            <BookOpen size={16} /> Buka Materi Pertama
          </Button>
        )}
        <Button variant="outline" className="flex-1 gap-2" onClick={() => onNavigate("/materials")}>
          <List size={16} /> Lihat Semua Materi
        </Button>
      </div>

      <Button variant="ghost" className="gap-2" onClick={() => onNavigate("/vocabulary")}>
        <Languages size={16} /> Lihat Kosakata
      </Button>
    </motion.div>
  );
};

export default ImportCompleteStep;
