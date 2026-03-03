import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페르소나 만들기 | OpenPerso",
  description: "나만의 AI 페르소나를 만들어보세요. AI가 캐릭터 설정을 도와드립니다.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
