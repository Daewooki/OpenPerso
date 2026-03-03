import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | OpenPerso",
  description: "OpenPerso 이용약관 및 서비스 정책을 확인하세요.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
