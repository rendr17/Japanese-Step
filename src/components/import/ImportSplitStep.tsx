import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ImportAnalysis, ImportSettings } from "@/hooks/useImportMaterial";

interface Props {
  analysis: ImportAnalysis;
  setAnalysis: (a: ImportAnalysis) => void;
  settings: ImportSettings;
  setSettings: (s: ImportSettings) => void;
  onNext: () => void;
  onBack: () => void;
}

const ImportSplitStep = ({ analysis, setAnalysis, settings, setSettings, onNext, onBack }: Props) => {
  const toggleSection = (idx: number) => {
    const sections = [...analysis.sections];
    sections[idx] = { ...sections[idx], selected: !sections[idx].selected };
    setAnalysis({ ...analysis, sections });
  };

  const updateCategory = (idx: number, category: any) => {
    const sections = [...analysis.sections];
    sections[idx] = { ...sections[idx], category };
    setAnalysis({ ...analysis, sections });
  };

  const updateTitle = (idx: number, title: string) => {
    const sections = [...analysis.sections];
    sections[idx] = { ...sections[idx], title };
    setAnalysis({ ...analysis, sections });
  };

  const selectedCount = analysis.sections.filter((s) => s.selected).length;

  return (
    <div className="space-y-6">
      {/* Split mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Mode Split</Label>
        <Select value={settings.splitMode} onValueChange={(v) => setSettings({ ...settings, splitMode: v as any })}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Satu file → 1 materi</SelectItem>
            <SelectItem value="chapter">Pisah per Bab / Lesson</SelectItem>
            <SelectItem value="subtitle">Pisah per Subjudul</SelectItem>
            <SelectItem value="length">Pisah per panjang tertentu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bagian yang akan disimpan</h3>
          <span className="text-xs text-muted-foreground">{selectedCount}/{analysis.sections.length} dipilih</span>
        </div>

        {analysis.sections.map((section, idx) => (
          <Card key={idx} className={`p-4 transition-opacity ${!section.selected ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={section.selected}
                onCheckedChange={() => toggleSection(idx)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateTitle(idx, e.target.value)}
                  className="h-8 text-sm font-medium"
                />
                <div className="flex flex-wrap gap-2">
                  <Select value={section.category} onValueChange={(v) => updateCategory(idx, v)}>
                    <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grammar">Grammar</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="conversation">Conversation</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    </SelectContent>
                  </Select>
                  {section.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: section.content_html }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>Kembali</Button>
        <Button className="flex-1 gap-2" onClick={onNext} disabled={selectedCount === 0}>
          Lanjut: Ekstrak Kosakata <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ImportSplitStep;
