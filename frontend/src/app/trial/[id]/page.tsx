"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "@/components/chat/chat-message";
import { Loader2, LogIn, MessageCircle, SendHorizonal, Sparkles, User } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GuestPersona {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  category: string;
  greeting_message: string;
  conversation_starters: string[] | null;
  chat_count: number;
}

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const MAX_TURNS = 3;

export default function TrialChatPage() {
  const { id: personaId } = useParams<{ id: string }>();

  const [persona, setPersona] = useState<GuestPersona | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    async function fetchPersona() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/guest/persona/${personaId}`);
        if (!res.ok) throw new Error("Not found");
        const data: GuestPersona = await res.json();
        setPersona(data);
        if (data.greeting_message) {
          setMessages([
            {
              id: "greeting",
              role: "assistant",
              content: data.greeting_message,
            },
          ]);
        }
      } catch {
        setError("페르소나를 찾을 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchPersona();
  }, [personaId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = async (content: string) => {
    if (streaming || limitReached || !content.trim()) return;

    const userMsg: LocalMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };
    const assistantMsg: LocalMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setInputValue("");
    scrollToBottom();

    try {
      const res = await fetch(`${API_BASE}/api/v1/guest/chat/${personaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.limit_reached) {
              setLimitReached(true);
              setTurnsUsed(MAX_TURNS);
              setMessages((prev) => prev.slice(0, -1));
              break;
            }

            if (parsed.token) {
              setMessages((prev) =>
                prev.map((msg, i) =>
                  i === prev.length - 1 && msg.isStreaming
                    ? { ...msg, content: msg.content + parsed.token }
                    : msg
                )
              );
              scrollToBottom();
            }

            if (parsed.done) {
              if (parsed.turns_used !== undefined) {
                setTurnsUsed(parsed.turns_used);
              }
              if (parsed.turns_used >= MAX_TURNS) {
                setLimitReached(true);
              }
            }
          } catch {
            continue;
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { ...msg, isStreaming: false, content: msg.content || "응답을 생성하지 못했습니다." }
            : msg
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "페르소나를 찾을 수 없습니다."}</p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  const remainingTurns = MAX_TURNS - turnsUsed;
  const starters = persona.conversation_starters?.length
    ? persona.conversation_starters
    : ["안녕하세요!", "어떤 이야기를 해볼까요?"];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-xl">
            {persona.avatar_url && (
              <AvatarImage
                src={persona.avatar_url}
                alt={persona.name}
                className="rounded-xl object-cover"
              />
            )}
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-coral/20 text-sm font-bold">
              {persona.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-sm font-semibold">{persona.name}</h1>
            <p className="text-xs text-muted-foreground">
              체험판 · 남은 대화 {remainingTurns}/{MAX_TURNS}회
            </p>
          </div>
        </div>
        <Link href="/register">
          <Button size="sm" className="rounded-xl font-medium">
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            회원가입
          </Button>
        </Link>
      </header>

      {/* Turn progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(turnsUsed / MAX_TURNS) * 100}%` }}
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              personaName={persona.name}
              personaAvatarUrl={persona.avatar_url}
              isStreaming={msg.isStreaming}
            />
          ))}

          {/* Conversation starters */}
          {messages.length === 1 && !streaming && !limitReached && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>이런 이야기를 해보세요</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {starters.map((q) => (
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

          {/* Limit reached CTA */}
          {limitReached && (
            <div className="mx-auto mt-8 max-w-sm text-center">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <Sparkles className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-display text-lg font-bold">
                  체험이 끝났습니다
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {persona.name}와(과) 더 대화하고 싶으신가요?
                  <br />
                  회원가입하면 무제한으로 대화할 수 있어요.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href="/register" className="w-full">
                    <Button className="w-full rounded-xl font-semibold" size="lg">
                      무료로 시작하기
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full">
                    <Button
                      variant="ghost"
                      className="w-full rounded-xl text-muted-foreground"
                      size="sm"
                    >
                      이미 계정이 있으신가요? 로그인
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          {limitReached ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card/60 p-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              체험 횟수를 모두 사용했습니다.
              <Link href="/register" className="font-medium text-primary hover:underline">
                회원가입
              </Link>
              하고 계속 대화하세요!
            </div>
          ) : (
            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-card/60 p-2 backdrop-blur-sm transition-colors focus-within:border-primary/30">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0 rounded-xl"
                disabled={streaming || !inputValue.trim()}
                onClick={() => handleSend(inputValue)}
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
