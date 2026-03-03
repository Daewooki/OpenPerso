"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Crown,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

const FREE_FEATURES = [
  "하루 50회 메시지",
  "하루 5개 페르소나 생성",
  "하루 10회 AI 자동 생성",
  "하루 3회 이미지 생성",
  "하루 20회 음성 생성",
  "텍스트 채팅 + STT 입력",
  "모든 공개 페르소나 이용",
];

const PREMIUM_FEATURES = [
  "무제한 메시지",
  "무제한 페르소나 생성",
  "무제한 AI 자동 생성",
  "하루 50회 이미지 생성",
  "무제한 음성 생성",
  "텍스트 + 음성 대화 모드",
  "Voice Cloning (커스텀 보이스 1개)",
  "모든 공개 페르소나 이용",
  "Premium 전용 페르소나",
  "우선 응답 처리",
];

export default function PricingPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");

  const handleNotify = () => {
    if (!email.trim()) return;
    toast.success("출시 알림을 등록했습니다! 감사합니다.");
    setEmail("");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 rounded-lg">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          뒤로
        </Button>
      </Link>

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          무료로 시작하고, 더 많은 기능이 필요할 때 업그레이드하세요.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold tracking-tight">
                ₩0
              </span>
              <span className="text-sm text-muted-foreground">/월</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              AI 페르소나의 세계를 탐험하세요
            </p>
          </div>

          <ul className="mb-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            disabled={!!user}
          >
            {user ? "현재 사용 중" : "무료로 시작"}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className="relative rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-card/40 p-6 backdrop-blur-sm">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
            Coming Soon
          </div>

          <div className="mb-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              Premium
              <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold tracking-tight">
                ₩9,900
              </span>
              <span className="text-sm text-muted-foreground">/월</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              제한 없이 자유롭게 대화하세요
            </p>
          </div>

          <ul className="mb-6 space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">{f}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
              <Button
                onClick={handleNotify}
                className="rounded-xl font-semibold"
              >
                <Zap className="mr-1.5 h-4 w-4" />
                알림 받기
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Premium 출시 시 이메일로 알려드립니다
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-center font-display text-xl font-bold">
          자주 묻는 질문
        </h2>
        <div className="mt-8 space-y-4">
          {[
            {
              q: "무료 플랜으로도 충분한가요?",
              a: "네, 무료 플랜으로도 텍스트/음성 대화, 페르소나 생성, AI 이미지 생성 등 핵심 기능을 모두 이용할 수 있습니다. 일일 사용량에 제한이 있을 뿐입니다.",
            },
            {
              q: "Voice Cloning은 무엇인가요?",
              a: "자신의 목소리를 녹음하여 AI 페르소나에 적용할 수 있는 기능입니다. Premium 전용이며, 사용자당 1개의 커스텀 보이스를 만들 수 있습니다.",
            },
            {
              q: "Premium은 언제 출시되나요?",
              a: "현재 열심히 준비 중입니다. 이메일을 등록해주시면 출시 시 가장 먼저 알려드립니다.",
            },
            {
              q: "결제는 어떻게 하나요?",
              a: "Premium 출시 시 카드 결제, 간편 결제 등 다양한 결제 수단을 지원할 예정입니다.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-border/50 bg-card/40 p-5"
            >
              <h3 className="font-display font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
