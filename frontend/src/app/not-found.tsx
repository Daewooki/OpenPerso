import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-muted-foreground/30">
          404
        </h1>
        <p className="mt-4 font-display text-xl font-semibold">
          페이지를 찾을 수 없습니다
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
