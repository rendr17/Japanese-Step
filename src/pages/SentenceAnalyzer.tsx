import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, BookOpen, MessageCircle, ChevronDown, ChevronUp,
  Copy, Check, Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAnalyzeSentence, type AnalysisToken } from "@/hooks/useAnalyzeSentence";
import { useAddVocab } from "@/hooks/useVocabulary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const politenessConfig: Record<string, { label: string; icon: string; color: string }> = {
  casual: { label: "Kasual", icon: "😊", color: "bg-secondary text-secondary-foreground" },
  polite: { label: "Sopan", icon: "🙇", color: "bg-primary text-primary-foreground" },
  formal: { label: "Formal", icon: "🎩", color: "bg-jlpt text-jlpt-foreground" },
  honorific: { label: "Keigo", icon: "👑", color: "bg-accent text-accent-foreground" },
};

const typeColors: Record<string, string> = {
  Noun: "bg-primary/10 text-primary",
  Verb: "bg-secondary/10 text-secondary",
  Adjective: "bg-accent/10 text-accent",
  Particle: "bg-muted text-muted-foreground",
  Adverb: "bg-jft/10 text-[hsl(var(--jft))]",
};

const SentenceAnalyzer = () => {
  const [searchParams] = useSearchParams();
  const [sentence, setSentence] = useState(searchParams.get("q") ?? "");
  const { analyze, result, isLoading, error, clear, remaining } = useAnalyzeSentence();
  const addVocab = useAddVocab();
  const [addedTokens, setAddedTokens] = useState<Set<number>>(new Set());
  const [culturalOpen, setCulturalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      setSentence(q);
      analyze(q);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = () => {
    if (!sentence.trim()) return;
    setAddedTokens(new Set());
    analyze(sentence.trim());
  };

  const handleAddToken = async (token: AnalysisToken, idx: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login terlebih dahulu"); return; }
    addVocab.mutate(
      { kanji: token.kanji !== token.kana ? token.kanji : null, kana: token.kana, meaning: token.meaning, tags: ["analyzer"] },
      {
        onSuccess: () => {
          setAddedTokens((s) => new Set(s).add(idx));
          toast.success(`"${token.kana}" ditambahkan ke kosakata`);
        },
      },
    );
  };

  const handleAddAllTokens = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !result) return;
    const substantive = result.tokens.filter((t) => ["Noun", "Verb", "Adjective", "Adverb"].includes(t.type));
    for (let i = 0; i < substantive.length; i++) {
      const token = substantive[i];
      const originalIdx = result.tokens.indexOf(token);
      if (!addedTokens.has(originalIdx)) {
        addVocab.mutate(
          { kanji: token.kanji !== token.kana ? token.kanji : null, kana: token.kana, meaning: token.meaning, tags: ["analyzer"] },
        );
        setAddedTokens((s) => new Set(s).add(originalIdx));
      }
    }
    toast.success(`${substantive.length} kata ditambahkan ke kosakata`);
  };

  const handleSaveAsMaterial = async () => {
    if (!result) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login terlebih dahulu"); return; }

    const content = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Analisis Kalimat" }] },
        { type: "paragraph", content: [{ type: "text", text: sentence }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Struktur Grammar" }] },
        { type: "paragraph", content: [{ type: "text", text: `${result.grammar.pattern} — ${result.grammar.explanation}` }] },
      ],
    };

    const { error: err } = await supabase.from("materials").insert({
      title: `Analisis: ${sentence.slice(0, 40)}${sentence.length > 40 ? "…" : ""}`,
      category: "grammar" as const,
      level: result.jlpt_level.toLowerCase().replace("n", "n") as any,
      content,
      user_id: user.id,
      tags: ["ai-analysis"],
    });

    if (err) toast.error("Gagal menyimpan");
    else toast.success("Disimpan ke Materi");
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.tokens.map((t) => `${t.kanji} (${t.kana}) - ${t.meaning} [${t.type}]`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Languages size={24} className="text-primary" /> Analisis Kalimat
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisis struktur kalimat Jepang dengan AI — {remaining} analisis tersisa
        </p>
      </div>

      {/* Input */}
      <div className="zen-card p-5 mb-6">
        <Textarea
          placeholder="Paste kalimat bahasa Jepang di sini… 例：日本語を勉強しています"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="font-jp text-lg min-h-[100px] border-0 bg-transparent focus-visible:ring-0 resize-none p-0 mb-4"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Ctrl+Enter untuk analisis</span>
          <Button onClick={handleAnalyze} disabled={isLoading || !sentence.trim()} className="gap-2">
            <Sparkles size={16} />
            {isLoading ? "Menganalisis..." : "Analisis dengan AI"}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="zen-card p-5 border-destructive/50 bg-destructive/5 text-destructive text-sm">
          {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="jlpt-badge text-xs">{result.jlpt_level}</span>
              {(() => {
                const p = politenessConfig[result.politeness] ?? politenessConfig.polite;
                return (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.color}`}>
                    {p.icon} {p.label}
                  </span>
                );
              })()}
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={handleCopy}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Disalin" : "Salin"}
              </Button>
            </div>

            {/* Token breakdown */}
            <div className="zen-card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-serif font-semibold text-foreground text-sm">Breakdown Kata</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleAddAllTokens}>
                  <Plus size={12} /> Tambah Semua ke Vocab
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-medium">Kanji</TableHead>
                    <TableHead className="font-medium">Kana</TableHead>
                    <TableHead className="font-medium">Arti</TableHead>
                    <TableHead className="font-medium">Tipe</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.tokens.map((token, i) => (
                    <TableRow key={i} className="group">
                      <TableCell className="font-jp text-base font-medium">{token.kanji}</TableCell>
                      <TableCell className="font-jp text-sm text-muted-foreground">{token.kana}</TableCell>
                      <TableCell className="text-sm">{token.meaning}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[token.type] ?? "bg-muted text-muted-foreground"}`}>
                          {token.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAddToken(token, i)}
                              disabled={addedTokens.has(i)}
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              {addedTokens.has(i) ? <Check size={14} className="text-secondary" /> : <Plus size={14} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{addedTokens.has(i) ? "Sudah ditambah" : "Tambah ke Kosakata"}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Grammar structure */}
            <div className="zen-card p-5">
              <h2 className="font-serif font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> Struktur Grammar
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pattern</span>
                  <p className="font-jp text-base font-medium text-foreground mt-0.5">{result.grammar.pattern}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Struktur</span>
                  <p className="text-sm text-foreground mt-0.5 font-mono bg-muted/50 px-3 py-2 rounded-lg">{result.grammar.structure}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Penjelasan</span>
                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">{result.grammar.explanation}</p>
                </div>
              </div>
            </div>

            {/* Cultural notes */}
            {result.cultural_notes && result.cultural_notes.trim() && (
              <Collapsible open={culturalOpen} onOpenChange={setCulturalOpen}>
                <div className="zen-card p-5">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h2 className="font-serif font-semibold text-foreground text-sm flex items-center gap-2">
                      <MessageCircle size={16} className="text-accent" /> Catatan Budaya
                    </h2>
                    {culturalOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-sm text-foreground mt-3 leading-relaxed">{result.cultural_notes}</p>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Similar sentences */}
            {result.similar_sentences && result.similar_sentences.length > 0 && (
              <div className="zen-card p-5">
                <h2 className="font-serif font-semibold text-foreground text-sm mb-3">🔄 Latihan Pola Serupa</h2>
                <div className="space-y-3">
                  {result.similar_sentences.map((s, i) => (
                    <div key={i} className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-jp text-base text-foreground">{s.japanese}</p>
                      <p className="text-xs text-muted-foreground">{s.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pb-8">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSaveAsMaterial}>
                <BookOpen size={14} /> Simpan ke Materi
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { clear(); setSentence(""); }}>
                Analisis Baru
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SentenceAnalyzer;
