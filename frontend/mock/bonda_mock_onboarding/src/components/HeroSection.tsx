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
    <section className="bonda-onboarding-hero relative w-full overflow-hidden bg-white pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-200">

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100/80 shadow-sm mb-6 animate-fade-in">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700 tracking-tight">
            개인투자자를 위한 회사채 신용 변화 리포트
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-[46px] lg:text-[50px] font-extrabold text-[#0b1c30] tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.2] mb-6">
          보유 회사채, 무엇이 달라졌을까?<br />
          <span className="text-indigo-700">
            Bonda
          </span>
          가 근거별로 정리합니다
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-[17px] text-[#464555] max-w-2xl mx-auto leading-relaxed mb-8">
          공시 원문, 수식으로 계산한 지표, AI 해석을 한 화면에서 구분합니다.<br className="hidden sm:inline" />{' '}
          현재는 제품 흐름을 확인하기 위한 샘플 데이터로 제공됩니다.
        </p>

        {/* Dual CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-base font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Bell size={19} />
            <span>데모 종목 추가</span>
          </button>
          <button
            onClick={onDemoClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0b1c30] border border-slate-200/80 text-base font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <Play size={18} className="text-indigo-600 fill-indigo-600" />
            <span>샘플 리포트 둘러보기</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 pt-2 text-[#464555] text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>DART 연동 예정</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <BarChart3 size={16} className="text-indigo-600" />
            <span>신용평가 데이터 예시</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Calculator size={16} className="text-purple-600" />
            <span>수식 기반 정량 계산</span>
          </div>
          <div className="h-3 w-px bg-slate-300 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-teal-600" />
            <span>브라우저 데모 제공</span>
          </div>
        </div>
      </div>
    </section>
  );
};
