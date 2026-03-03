"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-muted-foreground/30">
          오류 발생
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          예상치 못한 문제가 발생했습니다.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
