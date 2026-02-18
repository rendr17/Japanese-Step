import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VocabItem {
  kanji: string;
  kana: string;
  meaning: string;
}

interface GrammarNote {
  pattern: string;
  explanation: string;
}

interface Props {
  vocabulary?: VocabItem[] | null;
  grammarNotes?: GrammarNote[] | null;
  culturalNote?: string | null;
}

const MaterialSupplementary = ({ vocabulary, grammarNotes, culturalNote }: Props) => {
  const [grammarOpen, setGrammarOpen] = useState(true);

  const hasVocab = vocabulary && vocabulary.length > 0;
  const hasGrammar = grammarNotes && grammarNotes.length > 0;
  const hasCultural = !!culturalNote;

  if (!hasVocab && !hasGrammar && !hasCultural) return null;

  return (
    <div className="space-y-6 mt-10 pt-8 border-t border-border">
      {/* Vocabulary */}
      {hasVocab && (
        <div className="zen-card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">📚 Kosakata ({vocabulary.length})</h3>
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
              {vocabulary.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-jp text-base">{v.kanji || "—"}</TableCell>
                  <TableCell className="font-jp text-base">{v.kana}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.meaning}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grammar Notes */}
      {hasGrammar && (
        <Collapsible open={grammarOpen} onOpenChange={setGrammarOpen}>
          <div className="zen-card p-0 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full px-5 py-3 border-b border-border flex items-center justify-between hover:bg-muted/30 transition-colors">
                <h3 className="text-sm font-medium text-foreground">📝 Catatan Grammar ({grammarNotes.length})</h3>
                {grammarOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y divide-border">
                {grammarNotes.map((g, i) => (
                  <div key={i} className="px-5 py-3">
                    <Badge variant="outline" className="font-jp text-sm mb-1.5">{g.pattern}</Badge>
                    <p className="text-sm text-muted-foreground leading-relaxed">{g.explanation}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Cultural Note */}
      {hasCultural && (
        <div className="zen-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-2">🎌 Catatan Budaya</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{culturalNote}</p>
        </div>
      )}
    </div>
  );
};

export default MaterialSupplementary;
