import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditorToolbar from "@/components/editor/EditorToolbar";
import FuriganaModal from "@/components/editor/FuriganaModal";
import MetadataSidebar from "@/components/editor/MetadataSidebar";
import ContentPreview from "@/components/editor/ContentPreview";
import { useMaterialEditor } from "@/hooks/useMaterialEditor";
import { Skeleton } from "@/components/ui/skeleton";

const MaterialEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    meta, content, isLoading, isDirty, isSaving, save, updateMeta, updateContent, isNew,
  } = useMaterialEditor(id);

  const [furiganaOpen, setFuriganaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "ここにコンテンツを書いてください..." }),
    ],
    content: content ?? undefined,
    onUpdate: ({ editor }) => {
      updateContent(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none font-jp focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  // Sync loaded content into editor
  if (editor && content && !editor.isDestroyed && editor.isEmpty && !isNew) {
    editor.commands.setContent(content);
  }

  const handleFuriganaInsert = useCallback(
    (kanji: string, reading: string) => {
      if (!editor) return;
      const rubyHtml = `<ruby>${kanji}<rt>${reading}</rt></ruby>`;
      editor.chain().focus().insertContent(rubyHtml).run();
    },
    [editor]
  );

  const handleLinkClick = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleImageClick = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const previewHtml = editor?.getHTML() ?? "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/materials")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-sm font-serif font-semibold text-foreground">
              {isNew ? "Materi Baru" : "Edit Materi"}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {isDirty ? "Belum disimpan" : "Tersimpan"}
              {isSaving && " • Menyimpan..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs" disabled={isNew}>
                <Trash2 size={14} />
                Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Buang perubahan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Semua perubahan yang belum disimpan akan hilang.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate("/materials")}>Ya, buang</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor + Preview split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
            <EditorToolbar
              editor={editor}
              onFuriganaClick={() => setFuriganaOpen(true)}
              onImageClick={handleImageClick}
              onLinkClick={handleLinkClick}
            />
            <div className="flex-1 overflow-y-auto bg-background">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 hidden lg:flex flex-col overflow-hidden border-l border-border">
            <ContentPreview html={previewHtml} />
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="w-64 shrink-0 border-l border-border p-4 overflow-y-auto hidden md:block bg-card/30">
          <MetadataSidebar meta={meta} onChange={updateMeta} />
        </div>
      </div>

      {/* Furigana modal */}
      <FuriganaModal
        open={furiganaOpen}
        onOpenChange={setFuriganaOpen}
        onInsert={handleFuriganaInsert}
      />
    </motion.div>
  );
};

export default MaterialEditor;
