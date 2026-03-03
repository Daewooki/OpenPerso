"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle } from "lucide-react";
import type { PersonaListItem } from "@/types";
import { CATEGORY_LABELS, type PersonaCategory } from "@/types";

const CATEGORY_EMOJIS: Record<string, string> = {
  celebrity: "⭐",
  anime_game: "🎮",
  original: "✨",
  helper: "📚",
  friend: "💬",
};

export function PersonaCard({ persona }: { persona: PersonaListItem }) {
  const emoji = CATEGORY_EMOJIS[persona.category] || "✨";
  const categoryLabel =
    CATEGORY_LABELS[persona.category as PersonaCategory] || persona.category;

  return (
    <Link href={`/persona/${persona.id}`}>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/5">
        <div className="flex items-start gap-3.5">
          <Avatar className="h-12 w-12 rounded-xl border border-border/50">
            {persona.avatar_url && (
              <AvatarImage src={persona.avatar_url} alt={persona.name} className="rounded-xl object-cover" />
            )}
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-coral/20 text-lg">
              {emoji}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
              {persona.name}
            </h3>
            {persona.tagline && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {persona.tagline}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="secondary" className="rounded-lg text-[11px] font-medium">
            {categoryLabel}
          </Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {persona.chat_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {persona.like_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
