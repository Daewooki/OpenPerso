"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Persona } from "@/types";
import { CATEGORY_LABELS, type PersonaCategory } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

const STEPS = ["기본 정보", "성격 설정", "확인 & 완료"] as const;

const PERSONALITY_SLIDERS = [
  { key: "humor", label: "유머 감각", emoji: "😄" },
  { key: "empathy", label: "공감 능력", emoji: "🤗" },
  { key: "seriousness", label: "진지함", emoji: "🧐" },
  { key: "creativity", label: "창의성", emoji: "🎨" },
  { key: "energy", label: "활발함", emoji: "⚡" },
];

export default function CreatePersonaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarCandidates, setAvatarCandidates] = useState<string[]>([]);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  // Step 2: Personality
  const [personality, setPersonality] = useState<Record<string, number>>({
    humor: 5,
    empathy: 5,
    seriousness: 5,
    creativity: 5,
    energy: 5,
  });
  const [personalityText, setPersonalityText] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");

  // Conversation starters
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);

  // Voice config
  const [ttsVoice, setTtsVoice] = useState("nova");

  // Step 3: Review
  const [visibility, setVisibility] = useState("public");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        const p = await api.get<Persona>(`/api/v1/personas/${editId}`);
        setName(p.name);
        setTagline(p.tagline || "");
        setCategory(p.category);
        setDescription(p.description || "");
        if (p.avatar_url) setAvatarUrl(p.avatar_url);
        if (p.voice_config?.tts_voice) setTtsVoice(p.voice_config.tts_voice);
        setSystemPrompt(p.system_prompt);
        setGreetingMessage(p.greeting_message);
        setVisibility(p.visibility);
        if (p.personality) {
          const traits = p.personality as Record<string, number | string>;
          const nums: Record<string, number> = {};
          for (const [k, v] of Object.entries(traits)) {
            if (typeof v === "number") nums[k] = v;
            if (k === "description" && typeof v === "string") setPersonalityText(v);
          }
          setPersonality((prev) => ({ ...prev, ...nums }));
        }
      } catch {
        toast.error("페르소나 정보를 불러올 수 없습니다.");
        router.push("/explore");
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [editId, router]);

  const handleGenerateAvatar = async () => {
    if (!name || !category) {
      toast.error("이름과 카테고리를 먼저 입력해주세요.");
      return;
    }
    setGeneratingAvatar(true);
    try {
      const result = await api.post<{ images: string[] }>(
        "/api/v1/personas/generate-avatar",
        { name, category, description: description || tagline || null }
      );
      setAvatarCandidates(result.images);
      if (result.images.length > 0 && !avatarUrl) {
        setAvatarUrl(result.images[0]);
      }
      toast.success("아바타 후보가 생성되었습니다!");
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 429) {
        toast.error(error.message);
      } else {
        toast.error("아바타 생성에 실패했습니다.");
      }
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleAutoGenerate = async (jumpToReview = false) => {
    if (!name || !category) {
      toast.error("이름과 카테고리를 먼저 입력해주세요.");
      return;
    }
    setGenerating(true);
    try {
      const result = await api.post<{
        name: string;
        tagline: string;
        description: string;
        system_prompt: string;
        greeting_message: string;
        personality: Record<string, number>;
        tags: string[];
        conversation_starters?: string[];
      }>("/api/v1/personas/generate", {
        name,
        category,
        description: description || tagline || null,
      });

      if (result.tagline) setTagline(result.tagline);
      if (result.description) setDescription(result.description);
      setSystemPrompt(result.system_prompt);
      setGreetingMessage(result.greeting_message);
      if (result.personality) {
        setPersonality((prev) => ({ ...prev, ...result.personality }));
      }
      if (result.conversation_starters) {
        setConversationStarters(result.conversation_starters);
      }

      if (jumpToReview) {
        toast.success("AI가 캐릭터를 완성했습니다! 아바타도 생성 중...");
        setStep(2);
        generateAvatarInBackground();
      } else {
        toast.success("AI가 캐릭터 설정을 생성했습니다!");
        setStep(1);
      }
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 429) {
        toast.error(error.message);
      } else {
        toast.error("자동 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const generateAvatarInBackground = async () => {
    if (!name || !category) return;
    setGeneratingAvatar(true);
    try {
      const result = await api.post<{ images: string[] }>(
        "/api/v1/personas/generate-avatar",
        { name, category, description: description || tagline || null }
      );
      setAvatarCandidates(result.images);
      if (result.images.length > 0 && !avatarUrl) {
        setAvatarUrl(result.images[0]);
      }
    } catch {
      // avatar is optional
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !category || !systemPrompt || !greetingMessage) {
      toast.error("필수 항목을 모두 채워주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name,
        tagline: tagline || null,
        description: description || null,
        avatar_url: avatarUrl || null,
        system_prompt: systemPrompt,
        greeting_message: greetingMessage,
        personality: {
          ...personality,
          description: personalityText || undefined,
        },
        voice_config: { tts_voice: ttsVoice },
        conversation_starters: conversationStarters.length > 0 ? conversationStarters : null,
        visibility,
        category,
        tags: null,
      };

      if (isEditing) {
        await api.put<Persona>(`/api/v1/personas/${editId}`, data);
        toast.success("페르소나가 수정되었습니다!");
        router.push(`/persona/${editId}`);
      } else {
        const persona = await api.post<Persona>("/api/v1/personas", data);
        toast.success("페르소나가 생성되었습니다!");
        router.push(`/persona/${persona.id}`);
      }
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 429) {
        toast.error(error.message);
      } else {
        toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">페르소나 불러오는 중...</p>
      </div>
    );
  }

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

      <h1 className="font-display text-2xl font-bold tracking-tight">
        {isEditing ? "페르소나 수정" : "페르소나 만들기"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isEditing ? "페르소나 설정을 수정합니다" : "나만의 AI 캐릭터를 만들어보세요"}
      </p>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-2 h-px w-8 bg-border/50" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 0 && (
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label>이름 *</Label>
            <Input
              placeholder="예: 아인슈타인, 스파이더맨, 학습 도우미..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>한 줄 소개</Label>
            <Input
              placeholder="이 캐릭터를 한 줄로 설명해주세요"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>상세 설명</Label>
            <Textarea
              placeholder="캐릭터의 배경, 특징 등을 자유롭게 적어주세요 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>

          {/* Avatar Section */}
          <div className="space-y-3 rounded-2xl border border-border/50 bg-card/40 p-4">
            <Label className="font-display text-sm font-semibold">
              프로필 이미지
            </Label>
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                    {name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !name || !category}
                  className="rounded-lg"
                >
                  {generatingAvatar ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  AI로 생성
                </Button>
                <p className="text-xs text-muted-foreground">
                  이름과 카테고리를 기반으로 3개의 후보를 생성합니다
                </p>
              </div>
            </div>
            {avatarCandidates.length > 0 && (
              <div className="flex gap-2 pt-1">
                {avatarCandidates.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatarUrl(url)}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                      avatarUrl === url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`후보 ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => handleAutoGenerate(true)}
              disabled={generating || !name || !category}
              className="w-full rounded-xl py-6 text-base font-semibold"
              size="lg"
            >
              {generating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              AI로 원클릭 생성
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              이름과 카테고리만으로 AI가 성격, 인사말, 아바타까지 모두 만들어줍니다
            </p>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">또는</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleAutoGenerate(false)}
                disabled={generating || !name || !category}
                className="flex-1 rounded-xl"
              >
                <Wand2 className="mr-1.5 h-4 w-4" />
                AI 생성 후 편집
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!name || !category) {
                    toast.error("이름과 카테고리는 필수입니다.");
                    return;
                  }
                  setStep(1);
                }}
                className="rounded-xl"
              >
                직접 설정 <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Personality */}
      {step === 1 && (
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <Label className="font-display text-sm font-semibold">성격 슬라이더</Label>
            {PERSONALITY_SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {s.emoji} {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {personality[s.key]}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={personality[s.key]}
                  onChange={(e) =>
                    setPersonality({
                      ...personality,
                      [s.key]: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>추가 성격 설명 (자유 텍스트)</Label>
            <Textarea
              placeholder="예: 밝고 유쾌하지만 진지한 주제에서는 깊이 있게 대화한다"
              value={personalityText}
              onChange={(e) => setPersonalityText(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>인사말 *</Label>
            <Textarea
              placeholder="대화 시작 시 캐릭터가 건네는 첫 인사"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
          </div>

          {/* Voice preset */}
          <div className="space-y-2">
            <Label>음성 프리셋</Label>
            <Select value={ttsVoice} onValueChange={setTtsVoice}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="음성을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alloy">Alloy (중성)</SelectItem>
                <SelectItem value="ash">Ash (남성)</SelectItem>
                <SelectItem value="coral">Coral (여성)</SelectItem>
                <SelectItem value="echo">Echo (남성)</SelectItem>
                <SelectItem value="fable">Fable (남성)</SelectItem>
                <SelectItem value="nova">Nova (여성)</SelectItem>
                <SelectItem value="onyx">Onyx (남성)</SelectItem>
                <SelectItem value="sage">Sage (여성)</SelectItem>
                <SelectItem value="shimmer">Shimmer (여성)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              음성 모드에서 사용될 페르소나의 목소리를 선택하세요
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {showAdvanced ? "고급 설정 숨기기" : "고급 설정 보기 (시스템 프롬프트)"}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-2">
                <Label>시스템 프롬프트</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                  className="rounded-xl font-mono text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              이전
            </Button>
            <Button
              onClick={() => {
                if (!greetingMessage) {
                  toast.error("인사말을 입력해주세요.");
                  return;
                }
                if (!systemPrompt) {
                  setSystemPrompt(
                    `당신은 "${name}"입니다. ${description || tagline || ""}\n사용자와 자연스럽게 대화하세요.`
                  );
                }
                setStep(2);
              }}
              className="flex-1 rounded-xl font-semibold"
            >
              다음 <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-coral/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold">
                    {name[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{name}</h3>
                {tagline && (
                  <p className="text-sm text-muted-foreground">{tagline}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">카테고리</span>
                <span>{CATEGORY_LABELS[category as PersonaCategory]}</span>
              </div>
              {PERSONALITY_SLIDERS.map((s) => (
                <div key={s.key} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {s.emoji} {s.label}
                  </span>
                  <span>{personality[s.key]}/10</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">첫 인사</p>
              <p className="mt-1 text-sm leading-relaxed">{greetingMessage}</p>
            </div>

            {conversationStarters.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">추천 대화</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {conversationStarters.map((s, i) => (
                    <span key={i} className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar candidates from one-click generation */}
          {generatingAvatar && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              아바타 이미지 생성 중...
            </div>
          )}
          {avatarCandidates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">아바타 선택</Label>
              <div className="flex gap-2">
                {avatarCandidates.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setAvatarUrl(url)}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                      avatarUrl === url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={url} alt={`후보 ${i + 1}`} className="h-full w-full object-cover" />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>공개 설정</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">비공개 (나만 사용)</SelectItem>
                <SelectItem value="public">공개 (누구나 탐색 가능)</SelectItem>
                <SelectItem value="unlisted">링크 공개 (링크가 있는 사용자만)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              이전
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-xl font-semibold"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "수정 완료" : "페르소나 완성"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
