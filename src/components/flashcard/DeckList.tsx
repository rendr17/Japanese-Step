import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Play, Trash2, BookOpen, Tag, Package } from "lucide-react";
import { toast } from "sonner";

interface DeckInfo {
  tag: string;
  totalCards: number;
  dueCards: number;
  newCards: number;
  reviewCards: number;
  masteredCards: number;
}

interface DeckListProps {
  onStudyDeck: (tag: string) => void;
}

function useDeckList() {
  return useQuery({
    queryKey: ["deck-list"],
    queryFn: async (): Promise<DeckInfo[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all vocab with their tags and SRS status
      const { data: vocabData, error: vocabError } = await supabase
        .from("vocab_bank")
        .select("id, tags")
        .eq("user_id", user.id)
        .not("tags", "is", null);

      if (vocabError) throw vocabError;

      // Get SRS logs for due cards
      const { data: srsData, error: srsError } = await supabase
        .from("srs_logs")
        .select("vocab_id, status, next_review_date")
        .eq("user_id", user.id);

      if (srsError) throw srsError;

      const srsMap = new Map(srsData?.map((s) => [s.vocab_id, s]) ?? []);
      const now = new Date().toISOString();

      // Group vocab by tag (each vocab can belong to multiple tags)
      const deckMap = new Map<string, DeckInfo>();

      for (const vocab of vocabData ?? []) {
        const tags = vocab.tags ?? [];
        for (const tag of tags) {
          if (!deckMap.has(tag)) {
            deckMap.set(tag, {
              tag,
              totalCards: 0,
              dueCards: 0,
              newCards: 0,
              reviewCards: 0,
              masteredCards: 0,
            });
          }

          const deck = deckMap.get(tag)!;
          deck.totalCards++;

          const srs = srsMap.get(vocab.id);
          if (!srs) {
            deck.newCards++;
          } else {
            if (srs.status === "mastered") {
              deck.masteredCards++;
            } else if (srs.next_review_date <= now) {
              deck.dueCards++;
            }
            if (srs.status === "new") deck.newCards++;
            if (srs.status === "review" || srs.status === "learning") deck.reviewCards++;
          }
        }
      }

      return Array.from(deckMap.values()).sort((a, b) => b.totalCards - a.totalCards);
    },
  });
}

const DeckList = ({ onStudyDeck }: DeckListProps) => {
  const { data: decks, isLoading, refetch } = useDeckList();
  const qc = useQueryClient();
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDeck = async () => {
    if (!deletingTag) return;
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all vocab IDs in this deck
      const { data: vocabData } = await supabase
        .from("vocab_bank")
        .select("id, tags")
        .eq("user_id", user.id)
        .contains("tags", [deletingTag]);

      if (vocabData) {
        for (const vocab of vocabData) {
          const newTags = (vocab.tags ?? []).filter((t) => t !== deletingTag);
          if (newTags.length === 0) {
            // No other tags — delete the vocab entirely
            await supabase.from("srs_logs").delete().eq("vocab_id", vocab.id);
            await supabase.from("vocab_bank").delete().eq("id", vocab.id);
          } else {
            // Just remove the tag
            await supabase.from("vocab_bank").update({ tags: newTags }).eq("id", vocab.id);
          }
        }
      }

      toast.success(`Deck "${deletingTag}" berhasil dihapus`);
      qc.invalidateQueries({ queryKey: ["deck-list"] });
      qc.invalidateQueries({ queryKey: ["flashcard-due-cards"] });
      refetch();
    } catch (e: any) {
      toast.error("Gagal menghapus deck: " + e.message);
    } finally {
      setIsDeleting(false);
      setDeletingTag(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="nori-card h-14 animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Package className="mx-auto text-muted-foreground" size={48} />
        <h3 className="text-lg font-semibold text-foreground">Belum Ada Deck</h3>
        <p className="text-sm text-muted-foreground">
          Import file Anki (.apkg, .txt, .csv) untuk membuat deck kosakata.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
        <span>Nama Deck</span>
        <span className="text-center">Baru</span>
        <span className="text-center">Review</span>
        <span className="text-center">Due</span>
        <span className="text-right">Aksi</span>
      </div>

      <div className="divide-y divide-border">
        {decks.map((deck, idx) => {
          const progressPercent = deck.totalCards > 0
            ? Math.round((deck.masteredCards / deck.totalCards) * 100)
            : 0;

          return (
            <motion.div
              key={deck.tag}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Deck name */}
              <div className="flex items-center gap-2 min-w-0">
                <Tag size={14} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">
                    {deck.tag === "anki-import" ? "Anki Import" : deck.tag}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={progressPercent} className="h-1 w-20" />
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {deck.totalCards} kartu
                    </span>
                  </div>
                </div>
              </div>

              {/* New cards */}
              <div className="text-center">
                <span className={`text-sm font-semibold ${deck.newCards > 0 ? "text-blue-500" : "text-muted-foreground"}`}>
                  {deck.newCards}
                </span>
              </div>

              {/* Review cards */}
              <div className="text-center">
                <span className={`text-sm font-semibold ${deck.reviewCards > 0 ? "text-secondary" : "text-muted-foreground"}`}>
                  {deck.reviewCards}
                </span>
              </div>

              {/* Due cards */}
              <div className="text-center">
                <span className={`text-sm font-bold ${deck.dueCards > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {deck.dueCards}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Button
                  size="sm"
                  variant={deck.dueCards > 0 ? "default" : "outline"}
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={() => onStudyDeck(deck.tag)}
                >
                  <Play size={11} /> Belajar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onStudyDeck(deck.tag)}>
                      <BookOpen size={14} className="mr-2" /> Mulai Sesi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeletingTag(deck.tag)}
                    >
                      <Trash2 size={14} className="mr-2" /> Hapus Deck
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Deck?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua kosakata yang hanya ada di deck <strong>"{deletingTag}"</strong> akan dihapus permanen.
              Kosakata yang memiliki tag lain hanya akan dihapus tag-nya saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeck}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeckList;
