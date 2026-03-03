import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필 | OpenPerso",
  description: "내 프로필과 설정을 관리하세요.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
