"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { ArrowRight, MessageCircle, Sparkles, Users, Mic, Bot } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "쉬운 페르소나 제작",
    desc: "이름만 입력하면 AI가 성격, 말투, 배경까지 자동으로 만들어드립니다.",
  },
  {
    icon: MessageCircle,
    title: "몰입감 있는 대화",
    desc: "당신을 기억하는 캐릭터와 깊이 있는 대화를 나눠보세요.",
  },
  {
    icon: Users,
    title: "공유하고 탐색하기",
    desc: "다른 크리에이터의 페르소나를 만나고, 내 캐릭터를 세상에 공개하세요.",
  },
  {
    icon: Mic,
    title: "멀티모달 대화",
    desc: "텍스트를 넘어 음성으로, 더 나아가 아바타와 대화하세요.",
  },
];

const SHOWCASE_PERSONAS = [
  { name: "아인슈타인", category: "유명인", emoji: "🧪", color: "from-blue-500/20 to-indigo-500/20" },
  { name: "스파이더맨", category: "캐릭터", emoji: "🕷️", color: "from-red-500/20 to-rose-500/20" },
  { name: "학습 도우미", category: "도우미", emoji: "📚", color: "from-emerald-500/20 to-teal-500/20" },
  { name: "감성 친구", category: "친구", emoji: "🌙", color: "from-amber-500/20 to-orange-500/20" },
  { name: "셜록 홈즈", category: "캐릭터", emoji: "🔍", color: "from-violet-500/20 to-purple-500/20" },
  { name: "요리 셰프", category: "도우미", emoji: "👨‍🍳", color: "from-yellow-500/20 to-amber-500/20" },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/[0.07] blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-rose-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/[0.04] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          <span className="text-gradient">OpenPerso</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/explore">
              <Button variant="default" className="rounded-full font-medium">
                탐색하기 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="rounded-full font-medium text-muted-foreground hover:text-foreground">
                  로그인
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full font-medium">
                  시작하기
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-16 text-center md:pt-28 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">AI 캐릭터와 대화하는 새로운 방법</span>
        </div>

        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          당신만의 캐릭터를
          <br />
          <span className="text-gradient">만들고, 대화하고, 공유하세요</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          누구나 몇 분 만에 나만의 AI 페르소나를 만들 수 있습니다.
          <br className="hidden md:block" />
          당신을 기억하는 캐릭터와 깊이 있는 대화를 나눠보세요.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={user ? "/explore" : "/register"}>
            <Button size="lg" className="h-13 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/20">
              무료로 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button size="lg" variant="outline" className="h-13 rounded-full px-8 text-base font-medium">
              페르소나 둘러보기
            </Button>
          </Link>
        </div>

        {/* Floating persona showcase */}
        <div className="relative mx-auto mt-20 max-w-3xl">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
            {SHOWCASE_PERSONAS.map((p, i) => (
              <div
                key={p.name}
                className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-2xl transition-transform duration-300 group-hover:scale-110`}>
                  {p.emoji}
                </div>
                <span className="text-xs font-medium">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 lg:px-8">
        <h2 className="font-display text-center text-2xl font-bold tracking-tight md:text-3xl">
          왜 <span className="text-gradient">OpenPerso</span> 인가요?
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/70"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center lg:px-8">
        <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 p-12 backdrop-blur-sm">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            지금 바로 시작하세요
          </h2>
          <p className="mt-3 text-muted-foreground">
            무료로 계정을 만들고 첫 번째 페르소나를 만들어보세요.
          </p>
          <Link href={user ? "/create" : "/register"}>
            <Button size="lg" className="mt-8 h-13 rounded-full px-10 text-base font-semibold shadow-lg shadow-primary/20">
              페르소나 만들기 <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 py-8 text-center text-sm text-muted-foreground">
        <span className="font-display font-semibold text-gradient">OpenPerso</span>
        <span className="ml-2">&copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
