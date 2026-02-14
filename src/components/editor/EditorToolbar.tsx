import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Image, Code, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EditorToolbarProps {
  editor: Editor | null;
  onFuriganaClick: () => void;
  onImageClick: () => void;
  onLinkClick: () => void;
}

const ToolbarButton = ({
  active,
  onClick,
  tooltip,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

const EditorToolbar = ({ editor, onFuriganaClick, onImageClick, onLinkClick }: EditorToolbarProps) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-border px-2 py-1.5 bg-card rounded-t-lg">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        tooltip="Bold"
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        tooltip="Italic"
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        tooltip="Underline"
      >
        <Underline size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        tooltip="Heading 1"
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        tooltip="Heading 2"
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        tooltip="Heading 3"
      >
        <Heading3 size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        tooltip="Bullet List"
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        tooltip="Numbered List"
      >
        <ListOrdered size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarButton onClick={onLinkClick} active={editor.isActive("link")} tooltip="Insert Link">
        <Link size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={onImageClick} tooltip="Insert Image URL">
        <Image size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        tooltip="Code Block"
      >
        <Code size={15} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={onFuriganaClick}
          >
            <Type size={14} />
            <span className="font-jp text-[10px]">振り仮名</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Add Furigana
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default EditorToolbar;
