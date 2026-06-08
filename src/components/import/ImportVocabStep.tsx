import { ChevronRight, BookMarked } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ImportAnalysis } from "@/hooks/useImportMaterial";

interface Props {
  analysis: ImportAnalysis;
  setAnalysis: (a: ImportAnalysis) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
  saveProgress: number;
}

const ImportVocabStep = ({ analysis, setAnalysis, onSave, onBack, isSaving, saveProgress }: Props) => {
  const toggleVocab = (idx: number) => {
    const vocabulary = [...analysis.vocabulary];
    vocabulary[idx] = { ...vocabulary[idx], selected: !vocabulary[idx].selected };
    setAnalysis({ ...analysis, vocabulary });
  };

  const updateVocab = (idx: number, field: string, value: string) => {
    const vocabulary = [...analysis.vocabulary];
    vocabulary[idx] = { ...vocabulary[idx], [field]: value };
    setAnalysis({ ...analysis, vocabulary });
  };

  const selectAll = (selected: boolean) => {
    setAnalysis({ ...analysis, vocabulary: analysis.vocabulary.map((v) => ({ ...v, selected })) });
  };

  const selectedCount = analysis.vocabulary.filter((v) => v.selected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading icon={BookMarked} label="Kosakata Terdeteksi" count={analysis.vocabulary.length} />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => selectAll(true)}>Pilih Semua</Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => selectAll(false)}>Hapus Semua</Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{selectedCount} kosakata dipilih untuk disimpan ke bank kosakata</p>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {analysis.vocabulary.map((vocab, idx) => (
          <Card key={idx} className={`p-3 transition-opacity ${!vocab.selected ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <Checkbox checked={vocab.selected} onCheckedChange={() => toggleVocab(idx)} />
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  value={vocab.kanji || ""}
                  onChange={(e) => updateVocab(idx, "kanji", e.target.value)}
                  placeholder="Kanji"
                  className="h-7 text-xs"
                />
                <Input
                  value={vocab.kana}
                  onChange={(e) => updateVocab(idx, "kana", e.target.value)}
                  placeholder="Kana"
                  className="h-7 text-xs"
                />
                <Input
                  value={vocab.meaning}
                  onChange={(e) => updateVocab(idx, "meaning", e.target.value)}
                  placeholder="Arti"
                  className="h-7 text-xs"
                />
              </div>
              {vocab.level && <Badge variant="outline" className="text-[10px] shrink-0">{vocab.level?.toUpperCase()}</Badge>}
            </div>
          </Card>
        ))}
      </div>

      {isSaving && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${saveProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">Menyimpan... {saveProgress}%</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>Kembali</Button>
        <Button className="flex-1 gap-2" onClick={onSave} disabled={isSaving}>
          {isSaving ? <><Loader2 size={16} className="animate-spin" />Menyimpan...</> : "Simpan Materi & Kosakata"}
        </Button>
      </div>
    </div>
  );
};

export default ImportVocabStep;
