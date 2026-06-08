import { useState } from "react";
import { Upload, FileText, ClipboardPaste, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    const maxPages = Math.min(pdf.numPages, 50);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      pages.push(pageText);
    }

    if (pdf.numPages > 50) {
      pages.push(`\n[... ${pdf.numPages - 50} halaman lainnya tidak diproses]`);
    }

    return pages.join("\n\n");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettings({ ...settings, fileName: file.name, sourceType: "upload" });

    if (file.name.endsWith(".txt") || file.type === "text/plain") {
      const text = await file.text();
      setRawText(text);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setIsParsing(true);
      try {
        const text = await extractTextFromPdf(file);
        setRawText(text);
        toast.success(`PDF berhasil diekstrak (${text.length.toLocaleString()} karakter)`);
      } catch (err) {
        console.error("PDF parse error:", err);
        toast.error("Gagal membaca PDF. Coba paste teksnya secara manual.");
      } finally {
        setIsParsing(false);
      }
    } else {
      setRawText(`[File: ${file.name}]\nFormat file ini belum didukung. Silakan gunakan PDF atau TXT.`);
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
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <FileText size={40} className={`mx-auto mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm text-muted-foreground mb-1">
                {isDragging ? "Lepaskan file di sini..." : "Drag & drop file PDF atau TXT ke sini"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">atau klik tombol di bawah (maks. 50 halaman untuk PDF)</p>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,.txt,.text" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" asChild disabled={isParsing}>
                  <span>{isParsing ? <><Loader2 size={14} className="animate-spin mr-2" />Membaca PDF...</> : "Pilih File"}</span>
                </Button>
              </label>
              {settings.sourceType === "upload" && settings.fileName !== "Pasted text" && (
                <p className="text-sm text-primary mt-3">📄 {settings.fileName}</p>
              )}
              {rawText && settings.sourceType === "upload" && (
                <p className="text-xs text-muted-foreground mt-2">{rawText.length.toLocaleString()} karakter diekstrak</p>
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
              <SelectItem value="textbook">Buku Pelajaran</SelectItem>
              <SelectItem value="article">Artikel / Reading</SelectItem>
              <SelectItem value="dialogue">Dialog Percakapan</SelectItem>
              <SelectItem value="notes">Catatan Pribadi</SelectItem>
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
              <SelectItem value="indonesian">Indonesia</SelectItem>
              <SelectItem value="english">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Target Jalur</Label>
          <Select value={settings.targetPath} onValueChange={(v) => setSettings({ ...settings, targetPath: v as any })}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jlpt">JLPT</SelectItem>
              <SelectItem value="jft">JFT</SelectItem>
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
