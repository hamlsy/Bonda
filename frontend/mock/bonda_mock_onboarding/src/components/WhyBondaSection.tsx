import React from 'react';
import { GitFork, History, Shield, Clock, TrendingUp, CheckCircle, ArrowUpRight } from 'lucide-react';
import { BondItem } from '../types';

interface WhyBondaSectionProps {
  activeBond: BondItem;
  onOpenPrinciples: () => void;
}

export const WhyBondaSection: React.FC<WhyBondaSectionProps> = ({
  activeBond,
  onOpenPrinciples
}) => {
  return (
    <section className="w-full py-20 bg-slate-100/70 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-3 tracking-wider">
            WHY BONDA
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0b1c30] tracking-tight mb-4">
            개인투자자에게 회사채 투자가 불안했던 이유,<br className="hidden sm:inline" />
            Bonda가 이렇게 해결합니다
          </h2>
          <p className="text-base text-[#464555] leading-relaxed">
            기관투자자 전용 블룸버그 터미널의 신용 모니터링 파워를 누구나 쉬운 모바일 친화 뷰로 재정의했습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Pillar 01 */}
          <div className="rounded-2xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <GitFork size={26} />
              </div>
              <span className="text-xs text-indigo-600 tracking-widest uppercase font-bold">
                PILLAR 01
              </span>
              <h3 className="text-lg font-bold text-[#0b1c30] mt-1 mb-3">
                흩어진 발행기업 정보 단일 뷰 통합
              </h3>
              <p className="text-sm text-[#464555] leading-relaxed mb-6">
                DART 전자공시, 증권사 크레딧 리포트, 한기평·나신평·한신평 3대 신평사 수시공시를 내 종목 하나의 타임라인으로 일목요연하게 꿰어드립니다.
              </p>
            </div>

            {/* Integrated Feed Widget */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-xs text-[#0b1c30] font-bold">실시간 통합 피드</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{activeBond.company}</span>
              </div>
              <div className="space-y-1.5 text-slate-600 text-xs">
                {activeBond.recentFeeds.map((feed, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-xs"
                  >
                    <span className="truncate pr-2 font-medium text-slate-700">{feed.title}</span>
                    <span className="text-slate-400 text-[10px] shrink-0">{feed.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pillar 02 */}
          <div className="rounded-2xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
                <History size={26} />
              </div>
              <span className="text-xs text-purple-600 tracking-widest uppercase font-bold">
                PILLAR 02
              </span>
              <h3 className="text-lg font-bold text-[#0b1c30] mt-1 mb-3">
                매수 시점 대비 변화된 신용위험 감지
              </h3>
              <p className="text-sm text-[#464555] leading-relaxed mb-6">
                현재 재무만 보는 것은 의미가 없습니다. 내가 샀던 그 날의 지표와 비교해 부채비율 급증, 매출채권 부실 징후 발생 시 카카오톡으로 즉시 알립니다.
              </p>
            </div>

            {/* Sparkline & Delta Widget */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#0b1c30] font-bold">부채비율 델타 추적</span>
                <span className="text-xs text-rose-600 font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={14} />
                  {activeBond.debtDelta.delta}
                </span>
              </div>
              <div className="relative py-2">
                <svg
                  className="w-full h-12 text-indigo-600 overflow-visible"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 40"
                >
                  <path
                    d="M 0,34 Q 50,32 100,22 T 160,14 T 200,6"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="34" fill="#4f46e5" r="4" />
                  <circle cx="200" cy="6" fill="#e11d48" r="4.5" />
                </svg>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-1">
                <span>매수일 ({activeBond.debtDelta.buyRatio}%)</span>
                <span className="text-rose-600 font-bold">현재 ({activeBond.debtDelta.currentRatio}%)</span>
              </div>
            </div>
          </div>

          {/* Pillar 03 */}
          <div className="rounded-2xl bg-white p-7 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-6">
                <Shield size={26} />
              </div>
              <span className="text-xs text-teal-700 tracking-widest uppercase font-bold">
                PILLAR 03
              </span>
              <h3 className="text-lg font-bold text-[#0b1c30] mt-1 mb-3">
                팩트와 AI의 엄격한 분리 원칙
              </h3>
              <p className="text-sm text-[#464555] leading-relaxed mb-6">
                금융 투자에서 거짓된 생성 AI 환각(Hallucination)은 치명적입니다. Bonda는 수학적 확정치와 생성형 추론을 시각적으로 철저히 격리합니다.
              </p>
            </div>

            {/* 3-Layer badge stack */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
              <div className="flex items-center gap-2.5 text-slate-700 text-xs font-medium bg-white p-2 rounded-lg border border-slate-100">
                <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>DART 원문: 100% 사실 인용</span>
              </div>
              <div className="flex items-center gap-2.5 text-indigo-800 text-xs font-medium bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <span>공식 계산: 결정론적 알고리즘</span>
              </div>
              <div className="flex items-center gap-2.5 text-purple-800 text-xs font-medium bg-purple-50/70 p-2 rounded-lg border border-purple-100">
                <span className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <span>AI 시나리오: 부도확률 해석 보조</span>
              </div>
              <button
                type="button"
                onClick={onOpenPrinciples}
                className="w-full text-center text-[11px] text-teal-700 hover:text-teal-900 font-bold pt-1 hover:underline cursor-pointer"
              >
                자세한 투명성 원칙 보기 &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
