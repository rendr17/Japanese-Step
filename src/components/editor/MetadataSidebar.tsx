import { useState } from "react";
import { Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Enums } from "@/integrations/supabase/types";

export interface MaterialMeta {
  title: string;
  category: Enums<"material_category">;
  level: Enums<"jlpt_level">;
  tags: string[];
  is_favorite: boolean;
}

interface MetadataSidebarProps {
  meta: MaterialMeta;
  onChange: (meta: MaterialMeta) => void;
}

const MetadataSidebar = ({ meta, onChange }: MetadataSidebarProps) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !meta.tags.includes(tag)) {
      onChange({ ...meta, tags: [...meta.tags, tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onChange({ ...meta, tags: meta.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Judul Materi</Label>
        <Input
          value={meta.title}
          onChange={(e) => onChange({ ...meta, title: e.target.value })}
          placeholder="Judul materi belajar..."
          className="font-serif text-lg font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Kategori</Label>
        <Select
          value={meta.category}
          onValueChange={(v) => onChange({ ...meta, category: v as Enums<"material_category"> })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grammar">Grammar</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="conversation">Conversation</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Level */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">JLPT Level</Label>
        <Select
          value={meta.level}
          onValueChange={(v) => onChange({ ...meta, level: v as Enums<"jlpt_level"> })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="n5">N5</SelectItem>
            <SelectItem value="n4">N4</SelectItem>
            <SelectItem value="n3">N3</SelectItem>
            <SelectItem value="n2">N2</SelectItem>
            <SelectItem value="n1">N1</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <div className="flex gap-1.5">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="#tag"
            className="h-8 text-xs flex-1"
          />
        </div>
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meta.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] gap-1 pr-1">
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Favorite */}
      <button
        onClick={() => onChange({ ...meta, is_favorite: !meta.is_favorite })}
        className="flex items-center gap-2 text-sm hover:text-foreground transition-colors w-full py-2"
      >
        <Star
          size={16}
          className={meta.is_favorite ? "text-accent fill-accent" : "text-muted-foreground"}
        />
        <span className={meta.is_favorite ? "text-foreground" : "text-muted-foreground"}>
          {meta.is_favorite ? "Favorit" : "Tandai sebagai favorit"}
        </span>
      </button>
    </div>
  );
};

export default MetadataSidebar;
