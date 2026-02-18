import { Upload, FileText, ClipboardPaste, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ImportSettings } from "@/hooks/useImportMaterial";

interface Props {
  rawText: string;
  setRawText: (t: string) => void;
  settings: ImportSettings;
  setSettings: (s: ImportSettings) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const ImportInputStep = ({ rawText, setRawText, settings, setSettings, onAnalyze, isAnalyzing }: Props) => {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettings({ ...settings, fileName: file.name, sourceType: "upload" });
    if (file.name.endsWith(".txt") || file.type === "text/plain") {
      const text = await file.text();
      setRawText(text);
    } else {
      setRawText(`[File: ${file.name}]\nUntuk PDF/DOCX, silakan copy-paste isi teksnya ke tab "Paste Text".`);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="paste" onValueChange={(v) => setSettings({ ...settings, sourceType: v === "upload" ? "upload" : "paste" })}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2"><Upload size={14} />Upload File</TabsTrigger>
          <TabsTrigger value="paste" className="gap-2"><ClipboardPaste size={14} />Paste Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="p-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
              <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">Upload file .txt untuk import otomatis</p>
              <p className="text-xs text-muted-foreground mb-4">Untuk PDF/DOCX, disarankan copy-paste teksnya ke tab "Paste Text"</p>
              <label className="cursor-pointer">
                <input type="file" accept=".txt,.text" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" asChild><span>Pilih File</span></Button>
              </label>
              {settings.sourceType === "upload" && settings.fileName !== "Pasted text" && (
                <p className="text-sm text-primary mt-3">📄 {settings.fileName}</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="paste">
          <Card className="p-6">
            <Textarea
              placeholder="Paste isi bab, dialog, atau teks Jepang di sini...&#10;&#10;Contoh:&#10;第1課 わたしは マイク・ミラーです。&#10;ミラー：はじめまして。マイク・ミラーです。アメリカから きました。..."
              className="min-h-[200px] text-sm font-mono"
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setSettings({ ...settings, sourceType: "paste", fileName: "Pasted text" }); }}
            />
            <p className="text-xs text-muted-foreground mt-2">{rawText.length.toLocaleString()} karakter</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Jenis Sumber</Label>
          <Select value={settings.sourceCategory} onValueChange={(v) => setSettings({ ...settings, sourceCategory: v as any })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="textbook">📖 Buku Pelajaran</SelectItem>
              <SelectItem value="article">📰 Artikel / Reading</SelectItem>
              <SelectItem value="dialogue">💬 Dialog Percakapan</SelectItem>
              <SelectItem value="notes">📝 Catatan Pribadi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Template (opsional)</Label>
          <Select value={settings.template} onValueChange={(v) => setSettings({ ...settings, template: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih template..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa template</SelectItem>
              <SelectItem value="minna_no_nihongo">Minna no Nihongo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Bahasa Penjelasan</Label>
          <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v as any })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="indonesian">🇮🇩 Indonesia</SelectItem>
              <SelectItem value="english">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Target Jalur</Label>
          <Select value={settings.targetPath} onValueChange={(v) => setSettings({ ...settings, targetPath: v as any })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jlpt">🎌 JLPT</SelectItem>
              <SelectItem value="jft">🏢 JFT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Level (opsional)</Label>
          <Select value={settings.level} onValueChange={(v) => setSettings({ ...settings, level: v })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Auto-detect" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              <SelectItem value="n5">N5</SelectItem>
              <SelectItem value="n4">N4</SelectItem>
              <SelectItem value="n3">N3</SelectItem>
              <SelectItem value="n2">N2</SelectItem>
              <SelectItem value="n1">N1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full gap-2" size="lg" onClick={onAnalyze} disabled={isAnalyzing || !rawText.trim()}>
        {isAnalyzing ? <><Loader2 size={16} className="animate-spin" />Menganalisis...</> : "Analisis & Susun Materi"}
      </Button>
    </div>
  );
};

export default ImportInputStep;
