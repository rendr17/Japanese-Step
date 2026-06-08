import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface UserContext {
  learning_path?: string;
  level?: string;
  recent_materials?: string[];
  vocab_count?: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useChatConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations((data as ChatConversation[]) ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: title || "Percakapan Baru" })
      .select("id")
      .single();
    if (error || !data) return null;
    await fetchConversations();
    return data.id;
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    await fetchConversations();
  };

  return { conversations, isLoading, createConversation, deleteConversation, refetch: fetchConversations };
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load messages for conversation
  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setIsLoading(true);
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      setMessages((data as ChatMessage[]) ?? []);
      setIsLoading(false);
    })();
  }, [conversationId]);

  const sendMessage = async (content: string, conversationId: string, user: { id: string }) => {
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Save user message
    const { data: userMsg } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, user_id: user.id, role: "user" as const, content })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg as ChatMessage]);
    }

    // Fetch user context
    const userContext = await fetchUserContext(user.id);

    // Build message history from DB (includes the message just saved)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const apiMessages = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const { count: priorCount } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("role", "user");
    const isFirstUserMessage = (priorCount ?? 0) <= 1;

    // Stream response
    setIsStreaming(true);
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages, userContext }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && !last.id?.startsWith("saved-")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: `streaming-${Date.now()}`, role: "assistant", content: assistantContent, created_at: new Date().toISOString() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) assistantContent += delta;
          } catch { /* ignore */ }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        const { data: assistantMsg } = await supabase
          .from("chat_messages")
          .insert({ conversation_id: conversationId, user_id: user.id, role: "assistant" as const, content: assistantContent })
          .select()
          .single();

        if (assistantMsg) {
          setMessages(prev => {
            const filtered = prev.filter(m => !m.id.startsWith("streaming-"));
            return [...filtered, assistantMsg as ChatMessage];
          });
        }

        // Update conversation title from first user message
        if (isFirstUserMessage) {
          const title = content.slice(0, 60) + (content.length > 60 ? "…" : "");
          await supabase.from("chat_conversations").update({ title }).eq("id", conversationId);
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errorMsg}`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, isLoading, isStreaming, sendMessage, setMessages };
}

async function fetchUserContext(userId: string): Promise<UserContext> {
  const ctx: UserContext = {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_path, daily_goal_xp")
    .eq("id", userId)
    .single();

  if (profile) {
    ctx.learning_path = profile.current_path;
  }

  const { data: materials } = await supabase
    .from("materials")
    .select("title, level")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (materials && materials.length > 0) {
    ctx.recent_materials = materials.map(m => m.title);
    ctx.level = materials[0].level;
  }

  const { count } = await supabase
    .from("vocab_bank")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== null) ctx.vocab_count = count;

  return ctx;
}
