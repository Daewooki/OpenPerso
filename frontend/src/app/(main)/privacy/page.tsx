"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 rounded-lg">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          뒤로
        </Button>
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">최종 수정일: 2026년 2월 27일</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">1. 수집하는 정보</h2>
          <p>
            OpenPerso(이하 &quot;서비스&quot;)는 서비스 제공을 위해 다음과 같은 정보를 수집합니다.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li><strong className="text-foreground">계정 정보</strong>: 이메일 주소, 이름, 프로필 이미지</li>
            <li><strong className="text-foreground">서비스 이용 정보</strong>: 생성한 페르소나, 대화 내용, 사용 기록</li>
            <li><strong className="text-foreground">기술 정보</strong>: IP 주소, 브라우저 종류, 접속 일시</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">2. 이용 목적</h2>
          <p>
            수집한 개인정보는 다음 목적으로만 이용됩니다.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>서비스 제공 및 계정 관리</li>
            <li>페르소나 생성 및 대화 기능 제공</li>
            <li>서비스 품질 향상 및 안정성 개선</li>
            <li>고객 문의 및 지원</li>
            <li>서비스 이용약관 위반 방지</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">3. 제3자 제공</h2>
          <p>
            서비스는 AI 대화 기능을 위해 OpenAI API를 사용합니다. 대화 내용을 포함한 일부 데이터가 OpenAI API를 통해 처리될 수 있으며, 
            OpenAI의 개인정보처리방침이 적용됩니다. OpenAI는 서비스 제공에 필요한 범위 내에서만 데이터를 처리하며, 
            모델 학습 목적으로 OpenAI가 사용자 데이터를 수집하지 않도록 설정되어 있습니다.
          </p>
          <p className="mt-2">
            그 외 법령에 따라 요청되는 경우를 제외하고, 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">4. 보존 기간</h2>
          <p>
            개인정보는 수집 및 이용 목적이 달성된 시점까지 보관합니다. 계정 삭제 시 관련 개인정보는 지체 없이 삭제합니다.
            다만, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>계정 정보: 계정 삭제 시까지</li>
            <li>대화 내역: 서비스 이용 기간 동안 (필요 시 삭제 요청 가능)</li>
            <li>접속 로그: 최대 1년</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">5. 이용자 권리</h2>
          <p>
            이용자는 언제든 다음 권리를 행사할 수 있습니다.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>계정 삭제를 통한 개인정보 전부 삭제</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 서비스 내 설정 또는 문의처를 통해 요청할 수 있으며, 요청 후 24시간 이내에 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">6. 쿠키</h2>
          <p>
            서비스는 이용자의 편의를 위해 쿠키를 사용합니다. 쿠키는 로그인 정보 유지, 서비스 이용 현황 분석 등에 사용됩니다.
            이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">7. 문의처</h2>
          <p>
            개인정보 처리와 관련한 문의, 불만, 권리 행사 요청은 아래로 연락해 주시기 바랍니다.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>이메일: privacy@openperso.com</li>
            <li>응답 시간: 영업일 기준 3일 이내</li>
          </ul>
          <p className="mt-2">
            개인정보 처리에 관한 불만이 있는 경우 개인정보보호위원회 또는 한국인터넷진흥원 개인정보침해신고센터에 분쟁을 조정해 달라고 요청할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
