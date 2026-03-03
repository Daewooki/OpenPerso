"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ["/explore", "/persona/", "/terms", "/privacy", "/pricing"];
  const isPublicPage = publicPaths.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirect}`);
    }
  }, [loading, user, router, pathname, isPublicPage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-32 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user && !isPublicPage) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
