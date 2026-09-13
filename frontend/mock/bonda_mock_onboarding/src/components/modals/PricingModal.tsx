import React, { useState } from 'react';
import { X, Check, Zap, Sparkles } from 'lucide-react';

interface PricingModalProps {
  onClose: () => void;
  onSelectPlan: (planName: string) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  onClose,
  onSelectPlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100 relative bg-gradient-to-b from-indigo-50/50 to-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            TRANSPARENT PRICING
          </div>
          <h3 className="text-2xl font-bold text-[#0b1c30]">
            합리적인 안심 채권 멤버십 플랜
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            개인투자자의 소중한 원금을 지키는 가장 확실한 투자
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 mt-4 text-xs">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                billingCycle === 'monthly' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              월간 결제
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              <span>연간 결제</span>
              <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                20% 할인
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                기본 플랜
              </span>
              <div className="flex items-baseline gap-1 mt-2 mb-4">
                <span className="text-3xl font-extrabold text-[#0b1c30]">0원</span>
                <span className="text-xs text-slate-500">/ 평생 무료</span>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                회사채 투자를 막 시작한 입문자를 위한 필수 모니터링 플랜
              </p>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>보유 회사채 <strong>최대 3개</strong> 동시 모니터링</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>주간 1회 안심 AI 리포트 이메일 발송</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>DART 수시공시 기본 요약</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>3대 투명성 검증 리포트 열람</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectPlan('Free')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                무료로 시작하기
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="border-2 border-indigo-600 rounded-2xl p-6 bg-gradient-to-b from-indigo-50/40 via-white to-white flex flex-col justify-between relative shadow-lg shadow-indigo-100">
            <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles size={11} />
              <span>가장 인기있는 선택</span>
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Bonda Pro
              </span>
              <div className="flex items-baseline gap-1 mt-2 mb-4">
                <span className="text-3xl font-extrabold text-indigo-900">
                  {billingCycle === 'yearly' ? '19,900원' : '24,900원'}
                </span>
                <span className="text-xs text-slate-500">/ 월</span>
              </div>
              <p className="text-xs text-slate-600 mb-6">
                거액의 회사채 포트폴리오를 빈틈없이 지키는 실전 투자자용
              </p>

              <div className="space-y-3 text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                  <span>보유 회사채 <strong>무제한</strong> 실시간 감시</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                  <span><strong>카카오톡 1초 긴급 알림톡</strong> 즉시 발송</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                  <span>DART 공시 원문 딥러닝 실시간 정밀 분석</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                  <span>국내 전종목 크레딧 스크리너 & 델타 레이더</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 shrink-0 stroke-[2.5]" />
                  <span>신평사 비공개 리포트 요약 브리핑</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onSelectPlan('Pro')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                Pro 14일 무료 체험 시작
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
