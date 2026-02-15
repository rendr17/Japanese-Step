import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, Layers, Volume2, Download, Upload,
  ChevronDown, ArrowUpDown, X, BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useVocabularySimple, useAddVocab, useUpdateVocab, useDeleteVocab,
  useBulkDeleteVocab, useAddToSrs, type VocabRow,
} from "@/hooks/useVocabulary";
import { toast } from "sonner";

// ── Vocab Form Dialog ──────────────────────────────────────────────
interface VocabFormData {
  kanji: string;
  kana: string;
  meaning: string;
  example_sentence: string;
  jlpt_level: string;
  tags: string;
}

const emptyForm: VocabFormData = {
  kanji: "", kana: "", meaning: "", example_sentence: "", jlpt_level: "n5", tags: "",
};

const VocabFormDialog = ({
  open, onOpenChange, editVocab,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editVocab?: VocabRow | null;
}) => {
  const addMut = useAddVocab();
  const updateMut = useUpdateVocab();
  const [form, setForm] = useState<VocabFormData>(emptyForm);

  useEffect(() => {
    if (editVocab) {
      setForm({
        kanji: editVocab.kanji ?? "",
        kana: editVocab.kana,
        meaning: editVocab.meaning,
        example_sentence: editVocab.example_sentence ?? "",
        jlpt_level: editVocab.jlpt_level ?? "n5",
        tags: (editVocab.tags ?? []).join(", "),
      });
    } else {
      setForm(emptyForm);
    }
  }, [editVocab, open]);

  const handleSubmit = () => {
    if (!form.kana.trim() || !form.meaning.trim()) {
      toast.error("Kana dan Meaning wajib diisi");
      return;
    }
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const payload = {
      kanji: form.kanji || null,
      kana: form.kana,
      meaning: form.meaning,
      example_sentence: form.example_sentence || null,
      jlpt_level: form.jlpt_level as any,
      tags: tags.length > 0 ? tags : null,
    };

    if (editVocab) {
      updateMut.mutate({ id: editVocab.id, ...payload }, {
        onSuccess: () => { toast.success("Kosakata diperbarui"); onOpenChange(false); },
      });
    } else {
      addMut.mutate(payload, {
        onSuccess: () => { toast.success("Kosakata ditambahkan"); onOpenChange(false); },
      });
    }
  };

  const set = (k: keyof VocabFormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editVocab ? "Edit Kosakata" : "Tambah Kosakata"}
          </DialogTitle>
          <DialogDescription>
            {editVocab ? "Perbarui detail kosakata" : "Tambahkan kosakata baru ke bank kamu"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Kanji</Label>
              <Input value={form.kanji} onChange={(e) => set("kanji", e.target.value)} placeholder="漢字" className="font-jp text-lg h-11" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Kana *</Label>
              <Input value={form.kana} onChange={(e) => set("kana", e.target.value)} placeholder="かんじ" className="font-jp text-lg h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Meaning *</Label>
            <Input value={form.meaning} onChange={(e) => set("meaning", e.target.value)} placeholder="Chinese characters" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Contoh Kalimat</Label>
            <Input value={form.example_sentence} onChange={(e) => set("example_sentence", e.target.value)} placeholder="漢字を書く" className="font-jp" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">JLPT Level</Label>
              <Select value={form.jlpt_level} onValueChange={(v) => set("jlpt_level", v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["n5", "n4", "n3", "n2", "n1"].map((l) => (
                    <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tags (koma)</Label>
              <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="kata kerja, bab1" className="text-xs" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={addMut.isPending || updateMut.isPending}>
            {editVocab ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Status badge ───────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  learning: "bg-primary/15 text-primary",
  review: "bg-accent/15 text-accent",
  mastered: "bg-secondary/15 text-secondary",
};

// ── Main Page ──────────────────────────────────────────────────────
const Vocabulary = () => {
  const isMobile = useIsMobile();
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState<"kana_az" | "newest" | "most_reviewed">("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<VocabRow | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = { level, status: "all", search: debouncedSearch, sort };
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useVocabularySimple(filters);
  const deleteMut = useDeleteVocab();
  const bulkDeleteMut = useBulkDeleteVocab();
  const addToSrsMut = useAddToSrs();

  const vocabs = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const obs = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting && hasNextPage) fetchNextPage(); },
      { threshold: 0.1 },
    );
    obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = () => {
    if (selected.size === vocabs.length) setSelected(new Set());
    else setSelected(new Set(vocabs.map((v) => v.id)));
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    bulkDeleteMut.mutate(ids, {
      onSuccess: () => { toast.success(`${ids.length} kosakata dihapus`); setSelected(new Set()); },
    });
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, { onSuccess: () => toast.success("Kosakata dihapus") });
  };

  const openEdit = (v: VocabRow) => { setEditItem(v); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setDialogOpen(true); };

  const handleExportCSV = () => {
    if (vocabs.length === 0) return;
    const headers = ["kanji", "kana", "meaning", "jlpt_level", "example_sentence", "tags"];
    const rows = vocabs.map((v) =>
      [v.kanji ?? "", v.kana, v.meaning, v.jlpt_level ?? "", v.example_sentence ?? "", (v.tags ?? []).join(";")].map((c) => `"${c}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vocabulary.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Kosakata Saya</h1>
            <p className="text-sm text-muted-foreground">{totalCount} kata</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </Button>
            <Button className="gap-1.5" onClick={openAdd}>
              <Plus size={16} /> Tambah Kosakata
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari kanji, kana, arti..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              {["n5", "n4", "n3", "n2", "n1"].map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="kana_az">A-Z (Kana)</SelectItem>
              <SelectItem value="most_reviewed">Most Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border">
                <span className="text-xs text-muted-foreground">{selected.size} dipilih</span>
                <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkDelete}>
                  <Trash2 size={12} /> Hapus
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                  Batal
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable isMobile={isMobile} />
      ) : vocabs.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : isMobile ? (
        <MobileCards vocabs={vocabs} onEdit={openEdit} onDelete={handleDelete} onAddSrs={(id) => { addToSrsMut.mutate(id); toast.success("Ditambahkan ke SRS"); }} />
      ) : (
        <DesktopTable
          vocabs={vocabs}
          selected={selected}
          toggleSelect={toggleSelect}
          toggleAll={toggleAll}
          onEdit={openEdit}
          onDelete={handleDelete}
          onAddSrs={(id) => { addToSrsMut.mutate(id); toast.success("Ditambahkan ke SRS"); }}
        />
      )}

      {/* Load more */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
            ))}
          </div>
        )}
      </div>

      {/* FAB for mobile */}
      {isMobile && (
        <button
          onClick={openAdd}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <Plus size={24} />
        </button>
      )}

      <VocabFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editVocab={editItem} />
    </>
  );
};

// ── Desktop Table ──────────────────────────────────────────────────
const DesktopTable = ({
  vocabs, selected, toggleSelect, toggleAll, onEdit, onDelete, onAddSrs,
}: {
  vocabs: VocabRow[];
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  toggleAll: () => void;
  onEdit: (v: VocabRow) => void;
  onDelete: (id: string) => void;
  onAddSrs: (id: string) => void;
}) => (
  <div className="rounded-xl border border-border overflow-hidden bg-card">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10">
            <Checkbox checked={selected.size === vocabs.length && vocabs.length > 0} onCheckedChange={toggleAll} />
          </TableHead>
          <TableHead className="font-medium">Kanji</TableHead>
          <TableHead className="font-medium">Kana</TableHead>
          <TableHead className="font-medium">Meaning</TableHead>
          <TableHead className="font-medium w-20">Level</TableHead>
          <TableHead className="font-medium">Tags</TableHead>
          <TableHead className="w-24 text-right font-medium">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vocabs.map((v) => (
          <TableRow key={v.id} className="group" data-state={selected.has(v.id) ? "selected" : undefined}>
            <TableCell>
              <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggleSelect(v.id)} />
            </TableCell>
            <TableCell className="font-jp text-base font-medium">{v.kanji ?? "—"}</TableCell>
            <TableCell className="font-jp text-base">{v.kana}</TableCell>
            <TableCell className="text-sm">{v.meaning}</TableCell>
            <TableCell>
              {v.jlpt_level && <span className="jlpt-badge text-[10px]">{v.jlpt_level.toUpperCase()}</span>}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(v.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {v.audio_url && (
                  <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Play audio">
                    <Volume2 size={14} />
                  </button>
                )}
                <button onClick={() => onEdit(v)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onAddSrs(v.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Add to SRS">
                  <Layers size={14} />
                </button>
                <button onClick={() => onDelete(v.id)} className="p-1.5 rounded-md hover:bg-muted text-destructive hover:text-destructive transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// ── Mobile Cards ───────────────────────────────────────────────────
const MobileCards = ({
  vocabs, onEdit, onDelete, onAddSrs,
}: {
  vocabs: VocabRow[];
  onEdit: (v: VocabRow) => void;
  onDelete: (id: string) => void;
  onAddSrs: (id: string) => void;
}) => (
  <div className="space-y-3">
    {vocabs.map((v, i) => (
      <motion.div
        key={v.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="zen-card p-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-jp text-xl font-semibold text-foreground">{v.kanji ?? v.kana}</p>
            {v.kanji && <p className="font-jp text-sm text-muted-foreground">{v.kana}</p>}
          </div>
          {v.jlpt_level && <span className="jlpt-badge text-[10px]">{v.jlpt_level.toUpperCase()}</span>}
        </div>
        <p className="text-sm text-foreground mb-2">{v.meaning}</p>
        {v.example_sentence && (
          <p className="text-xs text-muted-foreground font-jp mb-2 italic">「{v.example_sentence}」</p>
        )}
        {v.tags && v.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {v.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 pt-2 border-t border-border/50">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => onEdit(v)}>
            <Pencil size={12} /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => onAddSrs(v.id)}>
            <Layers size={12} /> SRS
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => onDelete(v.id)}>
            <Trash2 size={12} /> Hapus
          </Button>
        </div>
      </motion.div>
    ))}
  </div>
);

// ── Skeleton ───────────────────────────────────────────────────────
const SkeletonTable = ({ isMobile }: { isMobile: boolean }) => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={isMobile ? "zen-card p-4 space-y-2" : "flex items-center gap-4 px-4 py-3 border-b border-border"}>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
    ))}
  </div>
);

// ── Empty State ────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-xl font-serif font-semibold text-foreground mb-2">Belum ada kosakata</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">
      Mulai tambah kosakata dari materi atau manual untuk membangun bank kosakata pribadimu.
    </p>
    <Button onClick={onAdd} className="gap-2">
      <Plus size={16} /> Tambah Kosakata Pertama
    </Button>
  </motion.div>
);

export default Vocabulary;
