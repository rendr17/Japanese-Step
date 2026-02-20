import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, Star, MoreVertical, Copy, Trash2, Pencil, BookOpen, MessageCircle, FileText, Languages, SlidersHorizontal, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMaterials, useToggleFavorite, useDeleteMaterial, useDuplicateMaterial, type MaterialRow, type MaterialCategory } from "@/hooks/useMaterials";
import { toast } from "sonner";

function extractTextFromTiptap(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.text) return n.text;
  if (Array.isArray(n.content)) {
    return n.content.map(extractTextFromTiptap).join(" ").replace(/\s+/g, " ").trim();
  }
  return "";
}

const categoryConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  grammar: { icon: <FileText size={14} />, label: "Grammar", color: "bg-jlpt text-jlpt-foreground" },
  reading: { icon: <BookOpen size={14} />, label: "Reading", color: "bg-primary text-primary-foreground" },
  conversation: { icon: <MessageCircle size={14} />, label: "Conversation", color: "bg-jft text-jft-foreground" },
  vocabulary: { icon: <Languages size={14} />, label: "Vocabulary", color: "bg-accent text-accent-foreground" },
};

const MaterialCard = ({ material, index }: { material: MaterialRow; index: number }) => {
  const navigate = useNavigate();
  const toggleFav = useToggleFavorite();
  const deleteMat = useDeleteMaterial();
  const duplicateMat = useDuplicateMaterial();

  const cfg = categoryConfig[material.category] ?? categoryConfig.grammar;
  const contentPreview = (() => {
    if (!material.content) return "";
    if (typeof material.content === "string") {
      try {
        return extractTextFromTiptap(JSON.parse(material.content));
      } catch {
        return material.content;
      }
    }
    return extractTextFromTiptap(material.content);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="zen-card hover-lift group cursor-pointer break-inside-avoid mb-4"
      onClick={() => navigate(`/materials/${material.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <span className="jlpt-badge text-[10px]">{material.level.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFav.mutate({ id: material.id, is_favorite: !material.is_favorite });
            }}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <Star
              size={16}
              className={material.is_favorite ? "text-accent fill-accent" : "text-muted-foreground"}
            />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={16} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/materials/${material.id}/edit`); }}>
                <Pencil size={14} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateMat.mutate(material);
                  toast.success("Materi diduplikasi");
                }}
              >
                <Copy size={14} /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMat.mutate(material.id);
                  toast.success("Materi dihapus");
                }}
              >
                <Trash2 size={14} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif font-semibold text-foreground text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {material.title}
      </h3>

      {/* Content preview */}
      {contentPreview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{contentPreview.slice(0, 120)}</p>
      )}

      {/* Tags */}
      {material.tags && material.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {material.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
          {material.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{material.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-muted-foreground">
        {new Date(material.created_at).toLocaleDateString("ja-JP")}
      </p>
    </motion.div>
  );
};

const SkeletonCards = () => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="break-inside-avoid mb-4 rounded-xl border border-border p-6 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="text-6xl mb-4">📖</div>
    <h3 className="text-xl font-serif font-semibold text-foreground mb-2">Belum ada materi</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Mulai tambahkan materi belajar pertamamu. Kamu bisa menambah grammar, reading, conversation, atau vocabulary.
    </p>
  </motion.div>
);

const Materials = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<MaterialCategory | "all">("all");
  const [level, setLevel] = useState<"all" | "n5" | "n4" | "n3" | "n2" | "n1" | "none">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "favorites">("newest");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useMaterials({
    category,
    level,
    sort,
    search: debouncedSearch,
    tags: activeTags.length > 0 ? activeTags : undefined,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const materials = data?.pages.flatMap((p) => p.data) ?? [];

  // Collect all unique tags
  const allTags = [...new Set(materials.flatMap((m) => m.tags ?? []))];

  const removeTag = useCallback((tag: string) => {
    setActiveTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-serif font-bold text-foreground">Materi Belajar Saya</h1>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/materials/import")} >
              <FileUp size={16} />
              Import dari File
            </Button>
            <Button className="gap-2" onClick={() => navigate("/materials/new/edit")}>
              <Plus size={16} />
              Tambah Materi
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory | "all")}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SlidersHorizontal size={14} className="mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="grammar">Grammar</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="conversation">Conversation</SelectItem>
              <SelectItem value="vocabulary">Vocabulary</SelectItem>
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="n5">N5</SelectItem>
              <SelectItem value="n4">N4</SelectItem>
              <SelectItem value="n3">N3</SelectItem>
              <SelectItem value="n2">N2</SelectItem>
              <SelectItem value="n1">N1</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
              <SelectItem value="favorites">Favorit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Search & Tags */}
      <div className="mb-6 space-y-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 12).map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTags((prev) =>
                      isActive ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Active filters */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-[10px] pr-1">
                #{tag}
                <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            <button
              onClick={() => setActiveTags([])}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonCards />
      ) : materials.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {materials.map((mat, i) => (
              <MaterialCard key={mat.id} material={mat} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Materials;
