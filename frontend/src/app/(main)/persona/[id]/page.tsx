"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import type { Persona, Conversation } from "@/types";
import { CATEGORY_LABELS, type PersonaCategory } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  Pencil,
  Share2,
  Sparkles,
  User,
} from "lucide-react";

export default function PersonaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [starting, setStarting] = useState(false);

  const fetchPersona = useCallback(async () => {
    try {
      const data = await api.get<Persona>(`/api/v1/personas/${id}`);
      setPersona(data);
    } catch {
      toast.error("페르소나를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  useEffect(() => {
    if (!persona) return;
    document.title = persona.name + " | OpenPerso";
    const setMeta = (prop: string, content: string) => {
      let el = document.querySelector('meta[property="' + prop + '"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta("og:title", persona.name);
    setMeta("og:description", persona.tagline || persona.description || "AI 캐릭터와 대화해보세요");
    if (persona.avatar_url) setMeta("og:image", persona.avatar_url);
    setMeta("og:url", window.location.href);
  }, [persona]);

  const handleShare = async () => {
    if (!persona) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: persona.name + " - OpenPerso",
        text: persona.tagline || "AI 캐릭터와 대화해보세요",
        url,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다!");
    }
  };

  const handleLike = async () => {
    if (!persona) return;
    setLiking(true);
    try {
      const res = await api.post<{ is_liked: boolean }>(
        `/api/v1/personas/${persona.id}/like`
      );
      setPersona({
        ...persona,
        is_liked: res.is_liked,
        like_count: persona.like_count + (res.is_liked ? 1 : -1),
      });
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleStartChat = async () => {
    if (!persona) return;
    setStarting(true);
    try {
      const conv = await api.post<Conversation>("/api/v1/chat/conversations", {
        persona_id: persona.id,
      });
      router.push(`/chat/${conv.id}`);
    } catch {
      toast.error("대화를 시작할 수 없습니다.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="mt-8 h-20 w-20 rounded-2xl" />
        <Skeleton className="mt-4 h-6 w-48 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-lg" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">페르소나를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isOwner = user?.id === persona.creator_id;
  const categoryLabel =
    CATEGORY_LABELS[persona.category as PersonaCategory] || persona.category;

  const traits = persona.personality as Record<string, number | string> | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 rounded-lg"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        뒤로
      </Button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-20 w-20 rounded-2xl border border-border/50">
          {persona.avatar_url && (
            <AvatarImage src={persona.avatar_url} alt={persona.name} className="rounded-2xl object-cover" />
          )}
          <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-coral/20 text-4xl">
            {persona.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {persona.name}
              </h1>
              {persona.tagline && (
                <p className="mt-1 text-muted-foreground">{persona.tagline}</p>
              )}
            </div>
            {isOwner && (
              <Link href={`/create?edit=${persona.id}`}>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-lg">
              {categoryLabel}
            </Badge>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {user ? (
          <Button
            size="lg"
            className="flex-1 rounded-xl font-semibold"
            onClick={handleStartChat}
            disabled={starting}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            대화 시작하기
          </Button>
        ) : (
          <Link href={`/trial/${persona.id}`} className="flex-1">
            <Button size="lg" className="w-full rounded-xl font-semibold">
              <Sparkles className="mr-2 h-4 w-4" />
              3회 무료 체험하기
            </Button>
          </Link>
        )}
        <Button
          size="lg"
          variant="outline"
          className={`rounded-xl ${persona.is_liked ? "border-rose-500/30 text-rose-500" : ""}`}
          onClick={handleLike}
          disabled={liking}
        >
          <Heart className={`h-4 w-4 ${persona.is_liked ? "fill-current" : ""}`} />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-xl"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Report */}
      {!isOwner && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={async () => {
              try {
                await api.post(`/api/v1/personas/${persona.id}/report`, {
                  reason: "inappropriate",
                  detail: null,
                });
                toast.success("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
              } catch {
                toast.error("신고 처리에 실패했습니다.");
              }
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Flag className="h-3 w-3" />
            부적절한 콘텐츠 신고
          </button>
        </div>
      )}

      <Separator className="my-8" />

      {/* Description */}
      {persona.description && (
        <div className="mb-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            소개
          </h2>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">
            {persona.description}
          </p>
        </div>
      )}

      {/* Personality traits */}
      {traits && Object.keys(traits).length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            성격 특성
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(traits).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 p-3"
              >
                <span className="text-sm font-medium capitalize">{key}</span>
                {typeof value === "number" ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{value}/10</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Greeting preview */}
      <div className="mb-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          첫 인사
        </h2>
        <div className="mt-3 rounded-2xl border border-border/50 bg-card/40 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 rounded-lg">
              {persona.avatar_url && (
                <AvatarImage src={persona.avatar_url} alt={persona.name} className="rounded-lg object-cover" />
              )}
              <AvatarFallback className="rounded-lg bg-primary/10 text-sm">
                {persona.name[0]}
              </AvatarFallback>
            </Avatar>
            <p className="flex-1 text-sm leading-relaxed">
              {persona.greeting_message}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer for public personas */}
      {persona.visibility === "public" && (
        <p className="text-xs text-muted-foreground/60">
          이 페르소나는 AI가 생성한 가상의 캐릭터입니다. 실존 인물과의 유사성은
          창작 목적이며, 실제 인물의 견해나 발언을 대표하지 않습니다.
        </p>
      )}
    </div>
  );
}
