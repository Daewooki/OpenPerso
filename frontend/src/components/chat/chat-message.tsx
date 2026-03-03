"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  personaName?: string;
  personaAvatarUrl?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  personaName,
  personaAvatarUrl,
  imageUrl,
  audioUrl,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className={`h-8 w-8 shrink-0 rounded-lg ${isUser ? "mt-0.5" : ""}`}>
        {!isUser && personaAvatarUrl && (
          <AvatarImage src={personaAvatarUrl} alt={personaName || "P"} className="rounded-lg object-cover" />
        )}
        <AvatarFallback
          className={`rounded-lg text-xs font-semibold ${
            isUser
              ? "bg-primary/10 text-primary"
              : "bg-gradient-to-br from-primary/20 to-coral/20"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : personaName?.[0] || "P"}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : "rounded-tl-md border border-border/50 bg-card/80"
          }`}
        >
          <p className="whitespace-pre-wrap">{content}</p>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current" />
          )}
        </div>

        {imageUrl && (
          <div className="mt-2">
            <button onClick={() => setImageExpanded(!imageExpanded)} className="block">
              <img
                src={imageUrl}
                alt="Generated"
                className={`rounded-xl border border-border/50 transition-all ${
                  imageExpanded ? "max-w-full" : "max-w-[240px]"
                }`}
              />
            </button>
          </div>
        )}

        {audioUrl && (
          <div className="mt-2">
            <audio controls className="h-8 w-full max-w-[280px]" preload="none">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
