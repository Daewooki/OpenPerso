import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "탐색 | OpenPerso",
  description:
    "다양한 AI 페르소나를 탐색하고 대화를 시작하세요. 유명 인물, 친구, 튜터 등 수백 개의 캐릭터가 기다립니다.",
  openGraph: {
    title: "탐색 | OpenPerso",
    description: "다양한 AI 페르소나를 탐색하고 대화를 시작하세요.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
