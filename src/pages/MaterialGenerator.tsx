import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, BookOpen, MessageCircle, GraduationCap, Save,
  RefreshCw, FileText, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GeneratedMaterial {
  title: string;
  content_html: string;
  vocabulary: { kanji: string; kana: string; meaning: string }[];
  grammar_notes: { pattern: string; explanation: string }[];
  cultural_note: string;
  indonesian_translation: string;
}

interface HistoryItem {
  topic: string;
  level: string;
  type: string;
  result: GeneratedMaterial;
  timestamp: number;
}

const typeOptions = [
  { value: "dialogue", label: "Dialog", icon: MessageCircle, desc: "Percakapan natural" },
  { value: "reading", label: "Reading", icon: BookOpen, desc: "Bacaan / passage" },
  { value: "grammar", label: "Grammar", icon: GraduationCap, desc: "Penjelasan tatabahasa" },
];

const lengthOptions = [
  { value: "short", label: "Pendek", chars: "~3000 karakter" },
  { value: "medium", label: "Sedang", chars: "~5000 karakter" },
  { value: "long", label: "Panjang", chars: "~8000 karakter" },
];

/** Convert HTML string to a Tiptap-compatible JSON doc */
function htmlToTiptapJson(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  function parseNode(node: Node): any {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (!text) return null;
      return { type: "text", text };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const childContent = Array.from(el.childNodes)
      .map(parseNode)
      .filter(Boolean);

    // Handle inline marks
    if (tag === "strong" || tag === "b") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "bold" }],
      }));
    }
    if (tag === "em" || tag === "i") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "italic" }],
      }));
    }
    if (tag === "u") {
      return childContent.map((c: any) => ({
        ...c,
        marks: [...(c.marks || []), { type: "underline" }],
      }));
    }

    // Ruby tags: preserve as raw HTML text so generateHTML can render them
    if (tag === "ruby") {
      return { type: "text", text: el.outerHTML };
    }

    // Block elements
    if (tag === "p") {
      return { type: "paragraph", content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }] };
    }
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = parseInt(tag[1]);
      return { type: "heading", attrs: { level }, content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }] };
    }
    if (tag === "br") {
      return { type: "hardBreak" };
    }
    if (tag === "ul" || tag === "ol") {
      return { type: tag === "ul" ? "bulletList" : "orderedList", content: childContent.flat() };
    }
    if (tag === "li") {
      // Wrap li children in a paragraph if they're inline
      const hasBlock = childContent.flat().some((c: any) => ["paragraph", "heading", "bulletList", "orderedList"].includes(c?.type));
      if (hasBlock) return { type: "listItem", content: childContent.flat() };
      return { type: "listItem", content: [{ type: "paragraph", content: childContent.flat().length ? childContent.flat() : [{ type: "text", text: " " }] }] };
    }
    if (tag === "hr") {
      return { type: "horizontalRule" };
    }

    // Fallback: wrap children in paragraph or return children directly
    if (childContent.flat().length) return childContent.flat();
    return null;
  }

  const content = Array.from(body.childNodes)
    .map(parseNode)
    .flat()
    .filter(Boolean);

  // Ensure all top-level nodes are block nodes
  const blocks = content.map((node: any) => {
    if (["paragraph", "heading", "bulletList", "orderedList", "horizontalRule", "listItem", "hardBreak"].includes(node?.type)) {
      return node;
    }
    // Wrap inline content in a paragraph
    return { type: "paragraph", content: [node] };
  });

  return {
    type: "doc",
    content: blocks.length ? blocks : [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
  };
}

const MaterialGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("n5");
  const [type, setType] = useState("dialogue");
  const [length, setLength] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingHtml, setEditingHtml] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [grammarOpen, setGrammarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("gen_history") || "[]");
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("Masukkan topik"); return; }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-material", {
        body: { topic: topic.trim(), level, type, length },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResult(data as GeneratedMaterial);
      setEditingHtml(data.content_html);

      // Save to history
      const item: HistoryItem = { topic: topic.trim(), level, type, result: data, timestamp: Date.now() };
      const newHistory = [item, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem("gen_history", JSON.stringify(newHistory));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToMaterials = async () => {
    if (!result || !user) return;

    const categoryMap: Record<string, "grammar" | "reading" | "conversation"> = {
      dialogue: "conversation",
      reading: "reading",
      grammar: "grammar",
    };

    const htmlToSave = isEditing ? editingHtml : result.content_html;
    const content = htmlToTiptapJson(htmlToSave);

    const { error: err } = await supabase.from("materials").insert({
      title: result.title,
      category: categoryMap[type] ?? "grammar",
      level: level as any,
      content,
      user_id: user.id,
      tags: ["ai-generated", type],
      vocabulary: result.vocabulary.length > 0 ? result.vocabulary : null,
      grammar_notes: result.grammar_notes.length > 0 ? result.grammar_notes : null,
      cultural_note: result.cultural_note || null,
      indonesian_translation: result.indonesian_translation || null,
    } as any);

    if (err) { toast.error("Gagal menyimpan"); return; }

    // Auto-save vocabulary to vocab_bank with duplicate check
    let newCount = 0;
    let dupCount = 0;

    if (result.vocabulary.length > 0) {
      for (const v of result.vocabulary) {
        const { data: existing } = await supabase
          .from("vocab_bank")
          .select("id")
          .eq("kana", v.kana)
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          dupCount++;
        } else {
          const { error: vocabErr } = await supabase.from("vocab_bank").insert({
            kanji: v.kanji || null,
            kana: v.kana,
            meaning: v.meaning,
            jlpt_level: level as any,
            user_id: user.id,
            tags: ["ai-generated"],
          });
          if (!vocabErr) newCount++;
        }
      }
    }

    const vocabMsg = newCount > 0 || dupCount > 0
      ? ` · ${newCount} kata baru ditambahkan${dupCount > 0 ? ` (${dupCount} sudah ada)` : ""}`
      : "";
    toast.success(`Disimpan ke Materi${vocabMsg}`);
    navigate("/materials");
  };


  const handleLoadHistory = (item: HistoryItem) => {
    setTopic(item.topic);
    setLevel(item.level);
    setType(item.type);
    setResult(item.result);
    setEditingHtml(item.result.content_html);
    setShowHistory(false);
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <Sparkles size={24} className="text-primary" /> Generator Materi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Buat materi belajar bahasa Jepang dengan AI</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowHistory(!showHistory)}>
            <FileText size={14} /> Riwayat ({history.length})
          </Button>
        )}
      </div>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="zen-card p-4 space-y-2 max-h-60 overflow-y-auto">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Riwayat Generate</h3>
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleLoadHistory(item)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{item.level.toUpperCase()} · {item.type} · {new Date(item.timestamp).toLocaleDateString("id-ID")}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{item.type}</Badge>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="zen-card p-5 mb-6 space-y-5">
        {/* Topic */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topik</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Misal: Shopping at Konbini, Self Introduction, Asking for Directions..."
            className="mt-1.5 font-jp"
            onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
          />
        </div>

        {/* Level + Length */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level JLPT</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["n5", "n4", "n3", "n2", "n1"].map((l) => (
                  <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Panjang</label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {lengthOptions.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label} ({l.chars})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Type selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tipe Materi</label>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                    type === t.value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className="w-full gap-2">
          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isLoading ? "Sedang membuat materi..." : "Generate Materi"}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="zen-card p-5 border-destructive/50 bg-destructive/5 text-destructive text-sm mb-6">
          {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Title + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-foreground">{result.title}</h2>
              <span className="jlpt-badge text-xs">{level.toUpperCase()}</span>
              <Badge variant="secondary" className="text-[10px]">{typeOptions.find(t => t.value === type)?.label}</Badge>
            </div>

            {/* Content preview / editor */}
            <div className="zen-card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {isEditing ? "Mode Edit" : "Preview"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Preview" : "Edit"}
                </Button>
              </div>
              {isEditing ? (
                <textarea
                  value={editingHtml}
                  onChange={(e) => setEditingHtml(e.target.value)}
                  className="w-full min-h-[300px] p-5 bg-background text-sm font-mono resize-y border-0 focus:outline-none"
                />
              ) : (
                <div
                  className="p-5 prose prose-sm max-w-none font-jp leading-[1.8]"
                  dangerouslySetInnerHTML={{ __html: isEditing ? editingHtml : result.content_html }}
                />
              )}
            </div>

            {/* Vocabulary */}
            {result.vocabulary.length > 0 && (
              <div className="zen-card p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">📚 Kosakata ({result.vocabulary.length})</h3>
                  <Badge variant="secondary" className="text-[10px]">Auto-simpan saat simpan materi</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-medium">Kanji</TableHead>
                      <TableHead className="font-medium">Kana</TableHead>
                      <TableHead className="font-medium">Arti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.vocabulary.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-jp text-base font-medium">{v.kanji}</TableCell>
                        <TableCell className="font-jp text-sm text-muted-foreground">{v.kana}</TableCell>
                        <TableCell className="text-sm">{v.meaning}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Grammar notes */}
            {result.grammar_notes.length > 0 && (
              <Collapsible open={grammarOpen} onOpenChange={setGrammarOpen}>
                <div className="zen-card p-5">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <GraduationCap size={16} className="text-primary" /> Catatan Grammar ({result.grammar_notes.length})
                    </h3>
                    {grammarOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-3">
                      {result.grammar_notes.map((g, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="font-jp text-sm font-medium text-foreground">{g.pattern}</p>
                          <p className="text-xs text-muted-foreground mt-1">{g.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Cultural note */}
            {result.cultural_note && (
              <div className="zen-card p-5">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  🏯 Catatan Budaya
                </h3>
                <p className="text-sm text-foreground leading-relaxed">{result.cultural_note}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pb-8">
              <Button className="gap-1.5" onClick={handleSaveToMaterials}>
                <Save size={14} /> Simpan ke Materi
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={handleGenerate}>
                <RefreshCw size={14} /> Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MaterialGenerator;
