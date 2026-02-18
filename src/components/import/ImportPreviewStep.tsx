import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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

const ImportPreviewStep = ({ analysis, setAnalysis, settings, setSettings, onNext, onBack }: Props) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);

  const updateSectionTitle = (idx: number, title: string) => {
    const sections = [...analysis.sections];
    sections[idx] = { ...sections[idx], title };
    setAnalysis({ ...analysis, sections });
  };

  const updateSectionContent = (idx: number, content_html: string) => {
    const sections = [...analysis.sections];
    sections[idx] = { ...sections[idx], content_html };
    setAnalysis({ ...analysis, sections });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        {editingTitle ? (
          <div className="flex-1 flex gap-2">
            <Input
              value={analysis.suggested_title}
              onChange={(e) => setAnalysis({ ...analysis, suggested_title: e.target.value })}
              className="font-serif font-bold"
            />
            <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)}><Check size={16} /></Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-serif font-bold text-foreground flex-1">{analysis.suggested_title}</h2>
            <Button size="icon" variant="ghost" onClick={() => setEditingTitle(true)}><Pencil size={14} /></Button>
          </>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Level: {analysis.detected_level?.toUpperCase()}</Badge>
        <Badge variant="secondary">Kategori: {analysis.suggested_category}</Badge>
        {analysis.suggested_tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">📋 Ringkasan</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {analysis.summary.map((s, i) => <li key={i}>• {s}</li>)}
        </ul>
      </Card>

      {/* Save mode toggle */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Simpan isi lengkap dari teks yang diupload</Label>
          <Switch
            checked={settings.saveFullContent}
            onCheckedChange={(v) => setSettings({ ...settings, saveFullContent: v })}
          />
        </div>
        {settings.saveFullContent && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>Pastikan kamu punya hak untuk menyimpan konten penuh dari file ini. Konten hanya disimpan di akun pribadimu.</p>
          </motion.div>
        )}
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">📚 Bagian Materi ({analysis.sections.length})</h3>
        {analysis.sections.map((section, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-center justify-between mb-2">
              {editingSectionIdx === idx ? (
                <div className="flex-1 flex gap-2">
                  <Input value={section.title} onChange={(e) => updateSectionTitle(idx, e.target.value)} className="text-sm" />
                  <Button size="icon" variant="ghost" onClick={() => setEditingSectionIdx(null)}><Check size={14} /></Button>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium">{section.title}</h4>
                  <Button size="icon" variant="ghost" onClick={() => setEditingSectionIdx(idx)}><Pencil size={12} /></Button>
                </>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] mb-2">{section.section_type}</Badge>
            {editingSectionIdx === idx ? (
              <Textarea
                value={section.content_html}
                onChange={(e) => updateSectionContent(idx, e.target.value)}
                className="text-xs font-mono min-h-[100px] mt-2"
              />
            ) : (
              <div className="text-xs text-muted-foreground line-clamp-3 mt-1" dangerouslySetInnerHTML={{ __html: section.content_html }} />
            )}
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>📝 {analysis.vocabulary.length} kosakata terdeteksi</span>
        <span>📐 {analysis.grammar_notes.length} pola grammar</span>
        {analysis.cultural_note && <span>🎌 Ada catatan budaya</span>}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>Kembali</Button>
        <Button className="flex-1 gap-2" onClick={onNext}>Lanjut: Split & Pilih <ChevronRight size={16} /></Button>
      </div>
    </div>
  );
};

export default ImportPreviewStep;
