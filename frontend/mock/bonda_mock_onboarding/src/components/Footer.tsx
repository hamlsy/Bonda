import React from 'react';

interface FooterProps {
  onOpenPrinciples: () => void;
  onOpenPricing: () => void;
  onOpenAlerts: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrinciples,
  onOpenPricing,
  onOpenAlerts,
  onOpenTerms
}) => {
  return (
    <footer className="w-full bg-slate-100/90 text-slate-600 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Branding */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold text-[#0b1c30]">Bonda AI</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                Retail Bond Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
              개인투자자를 위한 공시 기반 원문 데이터, 정량 부채 상환력 분석 및 객관적 AI 신용평가 모니터링 플랫폼입니다.
            </p>
            <div className="mt-2 text-xs text-slate-400 leading-relaxed">
              ㈜본다에이아이 | 대표자: 홍길동 | 사업자등록번호: 120-88-00000<br />
              서울특별시 영등포구 여의대로 108 파크원 타워 24층 | 고객지원: support@bonda.ai
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#0b1c30] mb-1">서비스</span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('demo-preview');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              회사채 스크리너
            </button>
            <button
              type="button"
              onClick={onOpenPrinciples}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              3대 투명성 검증 체계
            </button>
            <button
              type="button"
              onClick={onOpenAlerts}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              실시간 신용변동 경보
            </button>
            <button
              type="button"
              onClick={onOpenPricing}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              구독 및 멤버십 플랜
            </button>
          </div>

          {/* Legal / Policy */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#0b1c30] mb-1">안내 및 약관</span>
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              이용약관
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
            >
              개인정보처리방침
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-left text-xs sm:text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              투자유의사항 및 법적고지
            </button>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p className="max-w-2xl leading-relaxed">
            본 서비스의 AI 분석 및 지표는 투자 판단을 위한 단순 참고용 정보이며, 원금 손실 위험이 따르는 채권 투자 권유가 아닙니다.
          </p>
          <p className="shrink-0">© 2025 Bonda AI Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
