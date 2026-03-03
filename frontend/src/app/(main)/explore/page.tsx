"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonaCard } from "@/components/persona/persona-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import type { PersonaListItem, PersonaCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { Compass, Crown, Flame, Plus, Search, Sparkles, TrendingUp, Clock, Heart, X } from "lucide-react";

const SORTS = [
  { key: "popular", label: "인기순", icon: TrendingUp },
  { key: "likes", label: "좋아요순", icon: Heart },
  { key: "recent", label: "최신순", icon: Clock },
] as const;

const CATEGORIES: { key: string; label: string }[] = [
  { key: "", label: "전체" },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

export default function ExplorePage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [category, setCategory] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [featured, setFeatured] = useState<PersonaListItem[]>([]);
  const [trending, setTrending] = useState<PersonaListItem[]>([]);
  const [newPersonas, setNewPersonas] = useState<PersonaListItem[]>([]);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      params.set("sort_by", sortBy);
      params.set("limit", "30");

      const data = await api.get<PersonaListItem[]>(
        `/api/v1/explore?${params.toString()}`
      );
      setPersonas(data);
    } catch {
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  }, [category, sortBy]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPersonas();
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<PersonaListItem[]>(
        `/api/v1/explore/search?q=${encodeURIComponent(searchQuery)}`
      );
      setPersonas(data);
    } catch {
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  useEffect(() => {
    const loadCurated = async () => {
      try {
        const [f, t, n] = await Promise.all([
          api.get<PersonaListItem[]>("/api/v1/explore/featured?limit=6"),
          api.get<PersonaListItem[]>("/api/v1/explore/trending?limit=6"),
          api.get<PersonaListItem[]>("/api/v1/explore/new?limit=6"),
        ]);
        setFeatured(f);
        setTrending(t);
        setNewPersonas(n);
      } catch {}
    };
    loadCurated();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold tracking-tight">탐색</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          다양한 AI 페르소나를 만나보세요
        </p>
      </div>

      {/* Welcome Banner */}
      {!bannerDismissed && (
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-coral/5 p-6">
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">
                {user ? `${user.name}님, 환영합니다!` : "AI 캐릭터와 대화해보세요"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {user
                  ? "마음에 드는 페르소나를 찾아 대화를 시작하거나, 나만의 캐릭터를 만들어보세요."
                  : "가입하고 나만의 AI 페르소나를 만들어보세요. 무료로 시작할 수 있습니다."}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {user ? (
                <Link href="/create">
                  <Button className="rounded-xl font-medium">
                    <Plus className="mr-1.5 h-4 w-4" />
                    페르소나 만들기
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button className="rounded-xl font-medium">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    무료로 시작하기
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="페르소나 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" className="h-11 rounded-xl px-5">
          검색
        </Button>
      </div>

      {/* Staff Picks */}
      {featured.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <h2 className="font-display text-sm font-semibold">Staff Picks</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PersonaCard key={p.id} persona={p} />
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h2 className="font-display text-sm font-semibold">Trending</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((p) => (
              <PersonaCard key={p.id} persona={p} />
            ))}
          </div>
        </div>
      )}

      {/* New */}
      {newPersonas.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <h2 className="font-display text-sm font-semibold">새로 만들어진</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newPersonas.map((p) => (
              <PersonaCard key={p.id} persona={p} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={category === c.key ? "default" : "ghost"}
              className="rounded-full text-xs"
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {SORTS.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={sortBy === s.key ? "secondary" : "ghost"}
              className="rounded-lg text-xs"
              onClick={() => setSortBy(s.key)}
            >
              <s.icon className="mr-1 h-3 w-3" />
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">
            {searchQuery ? "검색 결과가 없어요" : "아직 페르소나가 없어요"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "다른 키워드로 검색해보거나 직접 만들어보세요."
              : "첫 번째 페르소나를 만들어 커뮤니티를 시작하세요!"}
          </p>
          <Link href="/create" className="mt-4">
            <Button className="rounded-xl font-medium">
              <Plus className="mr-1.5 h-4 w-4" />
              페르소나 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <PersonaCard key={p.id} persona={p} />
          ))}
        </div>
      )}
    </div>
  );
}
