import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Star, Share2, Trash2,
  Minus, Plus, Clock, BookOpen, FileText, MessageCircle, Languages,
} from "lucide-react";
import * as wanakana from "wanakana";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMaterialDetail, useRelatedMaterials } from "@/hooks/useMaterialDetail";
import MaterialSupplementary from "@/components/material/MaterialSupplementary";
import { useToggleFavorite, useDeleteMaterial } from "@/hooks/useMaterials";
import { toast } from "sonner";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  LinkExtension,
  ImageExt,
];

const categoryConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  grammar: { icon: <FileText size={14} />, label: "Grammar", color: "bg-jlpt text-jlpt-foreground" },
  reading: { icon: <BookOpen size={14} />, label: "Reading", color: "bg-primary text-primary-foreground" },
  conversation: { icon: <MessageCircle size={14} />, label: "Conversation", color: "bg-jft text-jft-foreground" },
  vocabulary: { icon: <Languages size={14} />, label: "Vocabulary", color: "bg-accent text-accent-foreground" },
};

function estimateReadingTime(text: string): number {
  // Japanese: ~400-600 chars/min. English: ~200 words/min. Rough estimate.
  const charCount = text.replace(/\s/g, "").length;
  return Math.max(1, Math.ceil(charCount / 500));
}

function jsonToPlainText(json: any): string {
  if (!json) return "";
  if (typeof json === "string") return json;
  if (json.text) return json.text;
  if (json.content) return json.content.map(jsonToPlainText).join(" ");
  return "";
}

function jsonToHtml(json: any): string {
  if (!json) return "";
  try {
    let html = generateHTML(json, extensions);
    html = html.replace(/&lt;ruby&gt;/g, "<ruby>").replace(/&lt;\/ruby&gt;/g, "</ruby>")
      .replace(/&lt;rt&gt;/g, "<rt>").replace(/&lt;\/rt&gt;/g, "</rt>")
      .replace(/&lt;rp&gt;/g, "<rp>").replace(/&lt;\/rp&gt;/g, "</rp>");
    return html;
  } catch {
    return typeof json === "string" ? json : "<p>Konten tidak dapat ditampilkan.</p>";
  }
}

/** Convert kana in text nodes of an HTML string to romaji */
function htmlToRomaji(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      node.textContent = wanakana.toRomaji(node.textContent);
    } else {
      // Skip <rt> tags when romaji mode is on (reading already converted)
      if ((node as Element).tagName === "RT") {
        node.textContent = "";
        return;
      }
      node.childNodes.forEach(walk);
    }
  };

  doc.body.childNodes.forEach(walk);
  return doc.body.innerHTML;
}

// ---------- Selection Toolbar ----------
const SelectionToolbar = ({ position, onClose }: { position: { x: number; y: number }; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => { toast.info("Fitur Flashcard segera hadir"); onClose(); }}>
        📇 Flashcard
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => {
        const sel = window.getSelection()?.toString().trim();
        if (sel) window.location.href = `/ai-tools/analyzer?q=${encodeURIComponent(sel)}`;
        onClose();
      }}>
        🤖 Analyze
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => { toast.info("Fitur Highlight segera hadir"); onClose(); }}>
        🖍️ Highlight
      </Button>
    </motion.div>
  );
};

// ---------- Related Card ----------
const RelatedCard = ({ material }: { material: any }) => {
  const cfg = categoryConfig[material.category] ?? categoryConfig.grammar;
  return (
    <Link
      to={`/materials/${material.id}`}
      className="zen-card hover-lift block p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
        <span className="jlpt-badge text-[10px]">{material.level.toUpperCase()}</span>
      </div>
      <h4 className="font-serif font-semibold text-sm text-foreground line-clamp-2">{material.title}</h4>
    </Link>
  );
};

// ---------- Main Page ----------
const MaterialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: material, isLoading } = useMaterialDetail(id);
  const { data: related } = useRelatedMaterials(material);
  const toggleFav = useToggleFavorite();
  const deleteMat = useDeleteMaterial();

  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [readProgress, setReadProgress] = useState(0);
  const [selToolbar, setSelToolbar] = useState<{ x: number; y: number } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll-based reading progress
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) { setReadProgress(100); return; }
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, (scrolled / total) * 100));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [material]);

  // Text selection handler
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelToolbar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelToolbar({ x: rect.left + rect.width / 2 - 100, y: rect.top - 44 });
  }, []);

  // Derive HTML — must be before early returns to keep hook order stable
  const rawHtml = useMemo(() => jsonToHtml(material?.content), [material?.content]);
  const html = useMemo(
    () => showRomaji ? htmlToRomaji(rawHtml) : rawHtml,
    [rawHtml, showRomaji]
  );

  if (isLoading) {
    return (
      <div className="max-w-[720px] mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Materi tidak ditemukan.</p>
        <Button variant="link" onClick={() => navigate("/materials")}>Kembali</Button>
      </div>
    );
  }

  const plainText = jsonToPlainText(material.content);
  const readingTime = estimateReadingTime(plainText);
  const cfg = categoryConfig[material.category] ?? categoryConfig.grammar;

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readProgress} className="h-1 rounded-none bg-muted" />
      </div>

      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[720px] mx-auto py-8 px-4"
      >
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground -ml-2" onClick={() => navigate("/materials")}>
          <ArrowLeft size={16} /> Kembali
        </Button>

        {/* Title */}
        <h1 className="text-3xl font-serif font-bold text-foreground leading-tight mb-4">
          {material.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="jlpt-badge text-xs">{material.level.toUpperCase()}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={13} /> {readingTime} menit
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(material.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {material.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px]">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/materials/${material.id}/edit`)}>
            <Pencil size={14} /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              toggleFav.mutate({ id: material.id, is_favorite: !material.is_favorite });
            }}
          >
            <Star size={14} className={material.is_favorite ? "fill-accent text-accent" : ""} />
            {material.is_favorite ? "Favorit" : "Tandai"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link disalin");
            }}
          >
            <Share2 size={14} /> Share
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive">
                <Trash2 size={14} /> Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus materi?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => { deleteMat.mutate(material.id); navigate("/materials"); toast.success("Materi dihapus"); }}>
                  Ya, hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Reading controls */}
        <div className="flex items-center justify-end gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ふりがな</span>
            <Switch
              checked={showFurigana}
              onCheckedChange={(v) => { setShowFurigana(v); if (v) setShowRomaji(false); }}
              disabled={showRomaji}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ローマ字</span>
            <Switch
              checked={showRomaji}
              onCheckedChange={(v) => { setShowRomaji(v); if (v) setShowFurigana(false); }}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize((s) => Math.max(14, s - 2))}>
              <Minus size={14} />
            </Button>
            <span className="text-xs text-muted-foreground w-5 text-center">{fontSize}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize((s) => Math.min(28, s + 2))}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="prose prose-sm max-w-none font-jp leading-[1.8]"
          style={{ fontSize: `${fontSize}px` }}
        >
          <style>{(!showFurigana && !showRomaji) ? `rt { display: none; }` : showRomaji ? `ruby { display: contents; } rt, rp { display: none; }` : ""}</style>
          <div dangerouslySetInnerHTML={{ __html: html }} />

          {/* Supplementary: Vocabulary, Grammar, Cultural Note */}
          <MaterialSupplementary
            vocabulary={material.vocabulary as any}
            grammarNotes={material.grammar_notes as any}
            culturalNote={material.cultural_note as any}
            indonesianTranslation={(material as any).indonesian_translation as string | null}
          />
        </div>

        {/* Selection toolbar */}
        {selToolbar && (
          <SelectionToolbar position={selToolbar} onClose={() => setSelToolbar(null)} />
        )}

        {/* Related materials */}
        {related && related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">Materi Terkait</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <RelatedCard key={r.id} material={r} />
              ))}
            </div>
          </section>
        )}
      </motion.article>
    </>
  );
};

export default MaterialDetail;
