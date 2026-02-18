import { useState } from "react";
import { useAdminQuestions, ExamQuestion, QuestionFormData } from "@/hooks/useAdminQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, ShieldAlert } from "lucide-react";

const EXAM_TYPES = [
  { value: "jlpt", label: "JLPT" },
  { value: "jft", label: "JFT Basic" },
];

const LEVELS = ["n5", "n4", "n3", "n2", "n1"];

const JLPT_SECTIONS = ["vocabulary", "grammar", "reading"];
const JFT_SECTIONS = ["kanji_reading", "vocabulary", "conversation", "situational"];

const emptyForm: QuestionFormData = {
  exam_type: "jlpt",
  level: "n5",
  section: "vocabulary",
  question_text: "",
  options: ["", "", "", ""],
  correct_answer: 0,
  explanation: "",
  difficulty: 3,
  tags: [],
  audio_prompt: "",
  image_prompt: "",
  transcript: "",
};

export default function AdminQuestions() {
  const {
    isAdmin, isAdminLoading, questions, isLoading,
    filters, setFilters, createQuestion, updateQuestion, toggleActive, isSaving,
  } = useAdminQuestions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormData>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isAdminLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Memuat...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <ShieldAlert className="h-12 w-12" />
        <p className="text-lg font-medium">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Admin.</p>
      </div>
    );
  }

  const sections = form.exam_type === "jft" ? JFT_SECTIONS : JLPT_SECTIONS;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.question_text.trim()) e.question_text = "Pertanyaan wajib diisi";
    form.options.forEach((o, i) => {
      if (!o.trim()) e[`option_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi`;
    });
    if (form.correct_answer < 0 || form.correct_answer > 3) e.correct_answer = "Jawaban benar harus A–D";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (q: ExamQuestion) => {
    setEditingId(q.id);
    setForm({
      exam_type: q.exam_type,
      level: q.level,
      section: q.section,
      question_text: q.question_text,
      options: (q.options as string[]).slice(0, 4) as [string, string, string, string],
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      difficulty: q.difficulty,
      tags: q.tags || [],
      audio_prompt: q.audio_prompt || "",
      image_prompt: q.image_prompt || "",
      transcript: q.transcript || "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingId) {
      await updateQuestion({ ...form, id: editingId });
    } else {
      await createQuestion(form);
    }
    setDialogOpen(false);
  };

  const sectionLabel = (s: string) => s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Bank Soal</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Tambah Soal Manual</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari soal..."
            className="pl-9"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <Select value={filters.exam_type} onValueChange={v => setFilters(f => ({ ...f, exam_type: v }))}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipe Ujian" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.level} onValueChange={v => setFilters(f => ({ ...f, level: v }))}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Level</SelectItem>
            {LEVELS.map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.section} onValueChange={v => setFilters(f => ({ ...f, section: v }))}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Section</SelectItem>
            {[...JLPT_SECTIONS, ...JFT_SECTIONS].map(s => <SelectItem key={s} value={s}>{sectionLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.is_active} onValueChange={v => setFilters(f => ({ ...f, is_active: v }))}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Non-aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Pertanyaan</TableHead>
              <TableHead className="w-[80px]">Tipe</TableHead>
              <TableHead className="w-[70px]">Level</TableHead>
              <TableHead className="w-[110px]">Section</TableHead>
              <TableHead className="w-[60px]">Aktif</TableHead>
              <TableHead className="w-[60px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Memuat soal...</TableCell></TableRow>
            ) : questions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada soal. Klik "Tambah Soal Manual" untuk memulai.</TableCell></TableRow>
            ) : (
              questions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">{q.question_text}</TableCell>
                  <TableCell><Badge variant="outline">{q.exam_type.toUpperCase()}</Badge></TableCell>
                  <TableCell>{q.level.toUpperCase()}</TableCell>
                  <TableCell><Badge variant="secondary">{sectionLabel(q.section)}</Badge></TableCell>
                  <TableCell>
                    <Switch
                      checked={q.is_active}
                      onCheckedChange={v => toggleActive({ id: q.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Soal" : "Tambah Soal Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Row: exam_type, level, section */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Tipe Ujian</Label>
                <Select value={form.exam_type} onValueChange={v => setForm(f => ({ ...f, exam_type: v, section: v === "jft" ? "kanji_reading" : "vocabulary" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sections.map(s => <SelectItem key={s} value={s}>{sectionLabel(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Question text */}
            <div className="space-y-1">
              <Label>Pertanyaan</Label>
              <Textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                placeholder="Tulis pertanyaan..."
                rows={3}
              />
              {errors.question_text && <p className="text-sm text-destructive">{errors.question_text}</p>}
            </div>

            {/* Options A–D */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="space-y-1">
                  <Label className="flex items-center gap-2">
                    Opsi {String.fromCharCode(65 + i)}
                    {form.correct_answer === i && <Badge className="text-xs">Jawaban Benar</Badge>}
                  </Label>
                  <Input
                    value={form.options[i]}
                    onChange={e => {
                      const opts = [...form.options] as [string, string, string, string];
                      opts[i] = e.target.value;
                      setForm(f => ({ ...f, options: opts }));
                    }}
                    placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                  />
                  {errors[`option_${i}`] && <p className="text-sm text-destructive">{errors[`option_${i}`]}</p>}
                </div>
              ))}
            </div>

            {/* Correct answer */}
            <div className="space-y-1">
              <Label>Jawaban Benar</Label>
              <Select value={String(form.correct_answer)} onValueChange={v => setForm(f => ({ ...f, correct_answer: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map(i => <SelectItem key={i} value={String(i)}>Opsi {String.fromCharCode(65 + i)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <Label>Penjelasan (opsional)</Label>
              <Textarea
                value={form.explanation || ""}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Penjelasan jawaban benar..."
                rows={2}
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <Label>Difficulty (1–5)</Label>
              <Select value={String(form.difficulty)} onValueChange={v => setForm(f => ({ ...f, difficulty: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* JFT-specific fields */}
            {form.exam_type === "jft" && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-sm font-medium text-muted-foreground">Field khusus JFT (opsional)</p>
                <div className="space-y-1">
                  <Label>Audio Prompt URL</Label>
                  <Input value={form.audio_prompt || ""} onChange={e => setForm(f => ({ ...f, audio_prompt: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <Label>Image Prompt URL</Label>
                  <Input value={form.image_prompt || ""} onChange={e => setForm(f => ({ ...f, image_prompt: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <Label>Transcript</Label>
                  <Textarea value={form.transcript || ""} onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))} rows={2} placeholder="Transkrip audio..." />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Soal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
