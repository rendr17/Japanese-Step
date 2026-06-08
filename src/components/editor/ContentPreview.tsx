import { useState } from "react";
import { Eye, EyeOff, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getFuriganaCss } from "@/lib/furigana";

interface ContentPreviewProps {
  html: string;
}

const ContentPreview = ({ html }: ContentPreviewProps) => {
  const [showFurigana, setShowFurigana] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 bg-card rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowFurigana(!showFurigana)}
              >
                {showFurigana ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {showFurigana ? "Hide Furigana" : "Show Furigana"}
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFontSize((s) => Math.max(12, s - 2))}
          >
            <Minus size={14} />
          </Button>
          <span className="text-[10px] text-muted-foreground w-6 text-center">{fontSize}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFontSize((s) => Math.min(24, s + 2))}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div
        className="flex-1 overflow-y-auto p-4 prose prose-sm max-w-none font-jp"
        style={{ fontSize: `${fontSize}px` }}
      >
        <style>{getFuriganaCss(showFurigana ? "always" : "never")}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default ContentPreview;
