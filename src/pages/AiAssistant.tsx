import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, Trash2, MessageSquare, Search, Bot, User,
  ChevronLeft, Sparkles, X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useChatConversations, useChatMessages } from "@/hooks/useAiChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const suggestedPrompts = [
  { label: "は vs が", message: "/explain は vs が の違い" },
  { label: "N5 Quiz", message: "/quiz N5 文法" },
  { label: "Kanji Tips", message: "How to memorize kanji effectively?" },
  { label: "Roleplay", message: "/practice カフェでの注文" },
];

const AiAssistant = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { conversations, isLoading: convLoading, createConversation, deleteConversation, refetch } = useChatConversations();
  const { messages, isLoading: msgLoading, isStreaming, sendMessage } = useChatMessages(activeConvId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput("");

    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(text.slice(0, 60));
      if (!convId) return;
      setActiveConvId(convId);
    }

    await sendMessage(text, convId, user!);
    refetch();
  };

  const handleNewChat = async () => {
    setActiveConvId(null);
    setInput("");
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteConv = async (id: string) => {
    await deleteConversation(id);
    if (activeConvId === id) setActiveConvId(null);
  };

  const handlePrompt = (msg: string) => {
    setInput(msg);
    textareaRef.current?.focus();
  };

  const filteredConversations = searchQuery
    ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] -m-4 lg:-m-6">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <motion.div
              initial={isMobile ? { x: -280 } : false}
              animate={{ x: 0 }}
              exit={isMobile ? { x: -280 } : undefined}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "flex flex-col border-r border-border bg-card/50",
                isMobile ? "fixed left-0 top-0 bottom-0 z-40 w-[280px]" : "w-[280px] shrink-0"
              )}
            >
              <div className="p-3 border-b border-border space-y-2">
                <Button onClick={handleNewChat} className="w-full gap-2 text-sm" size="sm">
                  <Plus size={16} /> Percakapan Baru
                </Button>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari percakapan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {convLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : filteredConversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Belum ada percakapan</p>
                  ) : (
                    filteredConversations.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors",
                          activeConvId === c.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                        onClick={() => handleSelectConv(c.id)}
                      >
                        <MessageSquare size={14} className="shrink-0" />
                        <span className="truncate flex-1 text-xs">{c.title}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus percakapan?</AlertDialogTitle>
                              <AlertDialogDescription>Semua pesan akan dihapus permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteConv(c.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/30">
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronLeft size={20} />
            </button>
          )}
          <Bot size={20} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-semibold text-sm text-foreground truncate">
              {activeConvId ? conversations.find(c => c.id === activeConvId)?.title ?? "Sensei AI" : "Sensei AI"}
            </h2>
            <p className="text-[10px] text-muted-foreground">Asisten belajar bahasa Jepang</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          {!activeConvId && messages.length === 0 ? (
            <WelcomeScreen onPrompt={handlePrompt} />
          ) : msgLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-3/4" />)}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble key={msg.id ?? i} message={msg} />
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="flex gap-1 pt-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-primary/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Suggested prompts when empty */}
        {!activeConvId && messages.length === 0 && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePrompt(p.message)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted/60 text-foreground transition-colors"
                >
                  <Sparkles size={12} className="inline mr-1 text-primary" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border bg-card/30">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tanya apa saja tentang bahasa Jepang..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-jp max-h-40"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="rounded-xl h-10 w-10 shrink-0"
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Ketik /quiz, /explain, atau /practice untuk perintah khusus
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Chat Bubble ────────────────────────────────────────────────────
const ChatBubble = ({ message }: { message: { role: string; content: string } }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} className="text-primary" />}
      </div>
      <div className={cn(
        "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-md"
          : "bg-muted/60 text-foreground rounded-tl-md"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Welcome Screen ─────────────────────────────────────────────────
const WelcomeScreen = ({ onPrompt }: { onPrompt: (msg: string) => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center py-20">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Bot size={32} className="text-primary" />
    </div>
    <h2 className="text-xl font-serif font-bold text-foreground mb-2">Sensei AI</h2>
    <p className="text-sm text-muted-foreground max-w-md mb-8">
      Asisten belajar bahasa Jepang pribadimu. Tanya tentang grammar, kanji, latihan, atau mulai roleplay percakapan!
    </p>
    <div className="grid grid-cols-2 gap-3 max-w-sm">
      {suggestedPrompts.map((p) => (
        <button
          key={p.label}
          onClick={() => onPrompt(p.message)}
          className="zen-card p-3 text-left hover:border-primary/30 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-foreground">{p.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{p.message}</p>
        </button>
      ))}
    </div>
  </motion.div>
);

export default AiAssistant;
