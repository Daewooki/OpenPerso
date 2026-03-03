"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 rounded-lg">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          뒤로
        </Button>
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight">이용약관</h1>
      <p className="mt-2 text-sm text-muted-foreground">최종 수정일: 2026년 2월 20일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">1. 서비스 개요</h2>
          <p>
            OpenPerso(이하 &quot;서비스&quot;)는 인공지능 기반 가상 캐릭터를 생성하고, 대화를 나누며, 공유할 수 있는 오픈 플랫폼입니다.
            서비스 내 모든 페르소나는 AI가 생성한 가상의 캐릭터이며, 실존 인물의 견해나 발언을 대표하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">2. 이용자의 의무</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>타인의 권리를 침해하거나 불법적인 콘텐츠를 생성하지 않아야 합니다.</li>
            <li>서비스를 악용하여 스팸, 피싱, 사기 등의 행위를 하지 않아야 합니다.</li>
            <li>다른 사용자의 계정을 무단으로 사용하지 않아야 합니다.</li>
            <li>미성년자에게 부적절한 콘텐츠를 생성하거나 유포하지 않아야 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">3. AI 생성 콘텐츠</h2>
          <p>
            서비스에서 AI가 생성한 텍스트, 이미지, 음성 등의 콘텐츠는 사실이 아닐 수 있으며, 정확성을 보장하지 않습니다.
            AI가 생성한 콘텐츠에 기반한 결정에 대해 서비스는 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">4. 개인정보 처리</h2>
          <p>
            서비스는 이용자의 이메일, 이름 등 최소한의 개인정보를 수집하며, 서비스 제공 목적으로만 사용합니다.
            대화 내용은 서비스 품질 향상을 위해 저장될 수 있으나, 제3자에게 공유되지 않습니다.
            이용자는 언제든 계정 삭제를 요청하여 개인정보를 제거할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">5. 면책 조항</h2>
          <p>
            서비스는 AI 기술의 특성상 예기치 않은 응답이 생성될 수 있습니다.
            서비스는 AI가 생성한 콘텐츠로 인한 직접적 또는 간접적 손해에 대해 책임을 지지 않습니다.
            서비스 이용 중 발생하는 문제에 대해 합리적인 범위 내에서 대응합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">6. 서비스 변경 및 중단</h2>
          <p>
            서비스는 사전 공지 후 서비스의 내용을 변경하거나 중단할 수 있습니다.
            유료 서비스의 경우 변경 시 이용자에게 사전에 안내합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
