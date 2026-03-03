import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 | OpenPerso",
  description:
    "OpenPerso의 무료 및 프리미엄 요금제를 비교하세요. 음성 대화, 이미지 생성, Voice Cloning 등 다양한 기능을 이용할 수 있습니다.",
  openGraph: {
    title: "요금제 | OpenPerso",
    description: "무료 및 프리미엄 요금제를 비교하세요.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
