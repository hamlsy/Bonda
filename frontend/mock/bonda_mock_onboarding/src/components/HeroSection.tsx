import React from 'react';
import { Bell, Play, CheckCircle, BarChart3, Calculator, Sparkles, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onRegisterClick: () => void;
  onDemoClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onRegisterClick,
  onDemoClick
}) => {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#f8f9ff] via-[#eff4ff]/60 to-[#f8f9ff] pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Ambient background glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-indigo-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100/80 shadow-sm mb-6 animate-fade-in">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-700 tracking-tight">
            ✨ 개인투자자를 위한 최초의 AI 회사채 신용 모니터링
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-[46px] lg:text-[50px] font-extrabold text-[#0b1c30] tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.2] mb-6">
          내가 산 회사채, 만기까지 안전할까?<br />
          <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Bonda
          </span>
          가 매일 24시간 대신 봅니다
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-[17px] text-[#464555] max-w-2xl mx-auto leading-relaxed mb-8">
          흩어진 DART 전자공시와 신평사 수시 보고서, 이제 직접 찾지 마세요.<br className="hidden sm:inline" />{' '}
          매수 이후 달라진 신용위험 신호부터 재무비율 변동까지 실시간으로 감지합니다.
        </p>

        {/* Dual CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-base font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Bell size={19} className="animate-bounce" />
            <span>3초 만에 내 채권 등록하고 모니터링 시작</span>
          </button>
          <button
            onClick={onDemoClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0b1c30] border border-slate-200/80 text-base font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <Play size={18} className="text-indigo-600 fill-indigo-600" />
            <span>라이브 데모 둘러보기 (로그인 없음)</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 pt-2 text-[#464555] text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>금융감독원 DART 연동</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <BarChart3 size={16} className="text-indigo-600" />
            <span>3대 신용평가사 데이터</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Calculator size={16} className="text-purple-600" />
            <span>결정론적(Deterministic) 정량 검증</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-teal-600" />
            <span>기본 무료 플랜 제공</span>
          </div>
        </div>
      </div>
    </section>
  );
};
