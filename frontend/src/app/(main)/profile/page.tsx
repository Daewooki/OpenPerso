"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaCard } from "@/components/persona/persona-card";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { PersonaListItem } from "@/types";
import { toast } from "sonner";
import {
  AlertTriangle,
  Brain,
  Crown,
  Loader2,
  LogOut,
  Mic,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";

interface MemoryItem {
  id: string;
  fact: string;
  category: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [personas, setPersonas] = useState<PersonaListItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPersonas = useCallback(async () => {
    try {
      const data = await api.get<PersonaListItem[]>("/api/v1/users/me/personas");
      setPersonas(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingPersonas(false);
    }
  }, []);

  const fetchMemories = useCallback(async () => {
    try {
      const data = await api.get<MemoryItem[]>("/api/v1/memories/global");
      setMemories(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
    fetchMemories();
  }, [fetchPersonas, fetchMemories]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.put("/api/v1/users/me", { name: newName.trim() });
      toast.success("이름이 변경되었습니다.");
      setEditingName(false);
      window.location.reload();
    } catch {
      toast.error("변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await api.delete(`/api/v1/memories/global/${memoryId}`);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      toast.success("기억이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleVoiceClone = async (file: File) => {
    setCloning(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);

      const token = api.getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/api/v1/voice/clone`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setClonedVoiceId(data.voice_id);
      toast.success("커스텀 보이스가 생성되었습니다!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "음성 클론에 실패했습니다.");
    } finally {
      setCloning(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/api/v1/users/me");
      logout();
      router.push("/login");
      toast.success("계정이 삭제되었습니다.");
    } catch {
      toast.error("계정 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* Profile header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 rounded-2xl border border-border/50">
          <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-coral/20 text-2xl font-bold">
            {user.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 w-48 rounded-lg"
                autoFocus
              />
              <Button
                size="sm"
                className="rounded-lg"
                onClick={handleUpdateName}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "저장"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={() => setEditingName(false)}
              >
                취소
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{user.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() => {
                  setNewName(user.name);
                  setEditingName(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2 rounded-lg text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="mr-1.5 h-3 w-3" />
            로그아웃
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      <Tabs defaultValue="personas">
        <TabsList className="rounded-xl">
          <TabsTrigger value="personas" className="rounded-lg">
            <User className="mr-1.5 h-3.5 w-3.5" />
            내 페르소나
          </TabsTrigger>
          <TabsTrigger value="memories" className="rounded-lg">
            <Brain className="mr-1.5 h-3.5 w-3.5" />
            내 기억
          </TabsTrigger>
          {user.tier === "premium" && (
            <TabsTrigger value="voice" className="rounded-lg">
              <Mic className="mr-1.5 h-3.5 w-3.5" />
              음성 클론
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personas" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {personas.length}개의 페르소나
            </p>
            <Link href="/create">
              <Button size="sm" className="rounded-full">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                새로 만들기
              </Button>
            </Link>
          </div>

          {loadingPersonas ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : personas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                ✨
              </div>
              <h3 className="mt-4 font-display font-semibold">
                아직 만든 페르소나가 없어요
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                첫 번째 캐릭터를 만들어보세요!
              </p>
              <Link href="/create">
                <Button size="sm" className="mt-4 rounded-full">
                  페르소나 만들기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {personas.map((p) => (
                <PersonaCard key={p.id} persona={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="memories" className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              AI가 당신에 대해 기억하고 있는 것들입니다.
              원치 않는 기억은 삭제할 수 있습니다.
            </p>
          </div>

          {loadingMemories ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                🧠
              </div>
              <h3 className="mt-4 font-display font-semibold">
                아직 기억된 것이 없어요
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                페르소나와 대화하면서 자연스럽게 기억이 쌓입니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm">{m.fact}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.category}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDeleteMemory(m.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {user.tier === "premium" && (
          <TabsContent value="voice" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="flex items-center gap-2 font-display font-semibold">
                  <Crown className="h-4 w-4 text-amber-500" />
                  커스텀 음성 클론
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  자신의 목소리를 녹음하여 페르소나에 적용할 수 있습니다. (1개 제한)
                </p>
              </div>

              {clonedVoiceId ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm font-medium">커스텀 보이스가 생성되었습니다!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Voice ID: {clonedVoiceId}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    페르소나 설정에서 이 음성을 적용할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
                  <Mic className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium">음성 샘플 업로드</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    10초 이상의 깨끗한 음성 파일을 업로드하세요 (WAV, MP3, 최대 10MB)
                  </p>
                  <label className="mt-4 inline-block">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVoiceClone(file);
                      }}
                      disabled={cloning}
                    />
                    <Button asChild disabled={cloning} className="rounded-xl">
                      <span>
                        {cloning ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {cloning ? "생성 중..." : "파일 선택"}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Separator className="my-10" />

      {/* Account Deletion */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h3 className="font-display text-sm font-semibold text-destructive">회원탈퇴</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          계정을 삭제하면 모든 페르소나, 대화 내역, 기억 등 모든 데이터가 영구적으로 삭제됩니다.
          이 작업은 되돌릴 수 없습니다.
        </p>
        {showDeleteConfirm ? (
          <div className="mt-4 space-y-3 rounded-xl border border-destructive/30 bg-background p-4">
            <p className="text-sm font-medium text-destructive">
              정말로 계정을 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-lg"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                삭제 확인
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            회원탈퇴
          </Button>
        )}
      </div>
    </div>
  );
}
