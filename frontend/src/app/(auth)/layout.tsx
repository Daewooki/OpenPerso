import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left decorative panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 h-64 w-64 rounded-full bg-rose-500/8 blur-[80px]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gradient">OpenPerso</span>
          </Link>

          <div>
            <blockquote className="max-w-md">
              <p className="font-display text-3xl font-bold leading-snug tracking-tight text-white">
                상상 속 캐릭터가
                <br />현실이 되는 순간
              </p>
              <p className="mt-4 text-base leading-relaxed text-stone-400">
                누구든 AI 페르소나를 만들고 대화할 수 있습니다.
                당신의 캐릭터가 세상을 만나는 곳.
              </p>
            </blockquote>
          </div>

          <div className="flex gap-3">
            {["🧪", "🕷️", "📚", "🌙"].map((emoji, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-lg backdrop-blur-sm"
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
