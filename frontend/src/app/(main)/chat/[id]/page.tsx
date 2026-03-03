"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { UsageLimitModal } from "@/components/usage/usage-limit-modal";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import type { Conversation, Message, Persona } from "@/types";
import { CATEGORY_LABELS, type PersonaCategory } from "@/types";
import { toast } from "sonner";
import {
  Loader2,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [personaName, setPersonaName] = useState("");
  const [personaAvatarUrl, setPersonaAvatarUrl] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingConv, setCreatingConv] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<Conversation[]>("/api/v1/chat/conversations");
      setConversations(data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Message[]>(
        `/api/v1/chat/conversations/${conversationId}/messages`
      );
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );

      const convs = await api.get<Conversation[]>("/api/v1/chat/conversations");
      setConversations(convs);
      const current = convs.find((c) => c.id === conversationId);
      if (current?.persona_name) {
        setPersonaName(current.persona_name);
      }
      if (current?.persona_avatar_url) {
        setPersonaAvatarUrl(current.persona_avatar_url);
      }
      if (current?.conversation_starters?.length) {
        setStarters(current.conversation_starters);
      }
    } catch {
      toast.error("대화를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (content: string) => {
    if (streaming) return;

    const userMsg: LocalMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantMsg: LocalMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    scrollToBottom();

    try {
      for await (const event of api.stream(
        `/api/v1/chat/conversations/${conversationId}/messages`,
        { content, voice_mode: voiceMode }
      )) {
        if (event.token) {
          setMessages((prev) =>
            prev.map((msg, i) =>
              i === prev.length - 1 && msg.isStreaming
                ? { ...msg, content: msg.content + event.token }
                : msg
            )
          );
        }
        if (event.image_url) {
          setMessages((prev) =>
            prev.map((msg, i) =>
              i === prev.length - 1
                ? { ...msg, imageUrl: event.image_url }
                : msg
            )
          );
        }
        if (event.audio_url) {
          setMessages((prev) =>
            prev.map((msg, i) =>
              i === prev.length - 1
                ? { ...msg, audioUrl: event.audio_url }
                : msg
            )
          );
          if (voiceMode) {
            try {
              const audio = new Audio(event.audio_url);
              audio.play();
            } catch { /* ignore autoplay restrictions */ }
          }
        }
        scrollToBottom();
      }

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 429) {
        setLimitMessage(error.message);
        setLimitModalOpen(true);
        setMessages((prev) => prev.slice(0, -2));
      } else {
        toast.error("응답을 받는 중 오류가 발생했습니다.");
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? { ...msg, isStreaming: false, content: msg.content || "응답을 생성하지 못했습니다." }
              : msg
          )
        );
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleSearchPersonas = useCallback(
    async (query: string) => {
      setSearching(true);
      try {
        const endpoint = query.trim()
          ? `/api/v1/explore/search?q=${encodeURIComponent(query.trim())}&limit=10`
          : `/api/v1/explore?sort_by=popular&limit=10`;
        const data = await api.get<Persona[]>(endpoint);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (newChatOpen) {
      handleSearchPersonas("");
    }
  }, [newChatOpen, handleSearchPersonas]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => handleSearchPersonas(value), 300);
  };

  const handleStartNewChat = async (personaId: string) => {
    setCreatingConv(personaId);
    try {
      const conv = await api.post<Conversation>("/api/v1/chat/conversations", {
        persona_id: personaId,
      });
      setNewChatOpen(false);
      setSidebarOpen(false);
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "대화 생성에 실패했습니다.");
    } finally {
      setCreatingConv(null);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await api.delete(`/api/v1/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (convId === conversationId) {
        router.push("/explore");
      }
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const newChatDialog = (
    <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">새 대화 시작</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="페르소나 검색..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="h-10 rounded-xl pl-9"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-[320px]">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다" : "공개된 페르소나가 없습니다"}
              </p>
            ) : (
              <div className="space-y-1">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleStartNewChat(p.id)}
                    disabled={creatingConv === p.id}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-coral/20">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                          {p.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {p.tagline && (
                        <p className="truncate text-xs text-muted-foreground">{p.tagline}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">
                        {CATEGORY_LABELS[p.category as PersonaCategory] || p.category}
                        {" · "}대화 {p.chat_count}회
                      </p>
                    </div>
                    {creatingConv === p.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );

  const conversationList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-sm font-semibold">대화 목록</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => setNewChatOpen(true)}
          title="새 대화"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-2 py-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            대화가 없습니다
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent ${
                  conv.id === conversationId ? "bg-accent" : ""
                }`}
              >
                <Link
                  href={`/chat/${conv.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Avatar className="h-7 w-7 shrink-0 rounded-md">
                    {conv.persona_avatar_url && (
                      <AvatarImage src={conv.persona_avatar_url} alt={conv.persona_name || ""} className="rounded-md object-cover" />
                    )}
                    <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                      {conv.persona_name?.[0] || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {conv.persona_name || "페르소나"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.title || "새 대화"}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDeleteConversation(conv.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {newChatDialog}
      <UsageLimitModal open={limitModalOpen} onOpenChange={setLimitModalOpen} message={limitMessage} />

      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-border/50 lg:block">
        {conversationList}
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex h-12 items-center gap-3 border-b border-border/50 px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {conversationList}
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 rounded-md">
              {personaAvatarUrl && (
                <AvatarImage src={personaAvatarUrl} alt={personaName} className="rounded-md object-cover" />
              )}
              <AvatarFallback className="rounded-md bg-gradient-to-br from-primary/20 to-coral/20 text-xs">
                {personaName?.[0] || "P"}
              </AvatarFallback>
            </Avatar>
            <span className="font-display text-sm font-semibold">
              {personaName || "페르소나"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/3"}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  personaName={personaName}
                  personaAvatarUrl={personaAvatarUrl}
                  imageUrl={msg.imageUrl}
                  audioUrl={msg.audioUrl}
                  isStreaming={msg.isStreaming}
                />
              ))}
              {messages.length === 1 && !streaming && (
                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>이런 이야기를 해보세요</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(starters.length > 0
                      ? starters
                      : ["안녕하세요!", "어떤 이야기를 해볼까요?", "뭘 도와줄 수 있어?"]
                    ).map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="rounded-full border border-border/60 bg-card/80 px-4 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl">
            <ChatInput
              onSend={handleSend}
              disabled={streaming || loading}
              voiceMode={voiceMode}
              onVoiceModeToggle={() => setVoiceMode(!voiceMode)}
              showVoiceToggle={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
