import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calculator, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { BondItem } from '../types';

interface InteractiveReportSectionProps {
  bonds: Record<string, BondItem>;
  activeBondId: string;
  onSelectBond: (id: string) => void;
  onOpenDart: (bond: BondItem) => void;
  onOpenAlertSetup: (bondName: string) => void;
}

export const InteractiveReportSection: React.FC<InteractiveReportSectionProps> = ({
  bonds,
  activeBondId,
  onSelectBond,
  onOpenDart,
  onOpenAlertSetup
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const activeBond = bonds[activeBondId] || Object.values(bonds)[0];

  const bondKeys = Object.keys(bonds);

  return (
    <section className="w-full py-16 bg-[#f8f9ff]" id="demo-preview">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-2.5">
              <Layers size={14} />
              <span>PROPRIETARY 3-LAYER ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0b1c30] tracking-tight">
              가입 즉시 보게 되는 Bonda의 투명성 리포트
            </h2>
          </div>
          <p className="text-sm md:text-[15px] text-[#464555] max-w-md leading-relaxed">
            단순한 AI 답변은 사양합니다.{' '}
            <strong className="font-semibold text-[#0b1c30]">공시 원문</strong>,{' '}
            <strong className="font-semibold text-[#0b1c30]">정량 수학 공식</strong>,{' '}
            <strong className="font-semibold text-[#0b1c30]">AI 해석</strong>을 명확히 분리하여 왜곡 없는 판단을 돕습니다.
          </p>
        </div>

        {/* Quick Search Simulator Tag Cloud */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-100/90 border border-slate-200/80 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-indigo-600" />
            <span className="text-xs sm:text-sm text-[#0b1c30] font-bold">내 보유 회사채 미리 시뮬레이션:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {bondKeys.map((key) => {
              const bond = bonds[key];
              const isSelected = activeBondId === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectBond(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-indigo-200 scale-102 ring-2 ring-indigo-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {bond.company}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Interactive Card */}
        <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/50 overflow-hidden transition-all duration-300">
          {/* Live Alert Banner */}
          <div
            className={`px-6 py-3.5 flex items-center justify-between flex-wrap gap-2 transition-colors ${
              activeBond.alertLevel === 'danger'
                ? 'bg-rose-50 border-b border-rose-200 text-rose-900'
                : activeBond.alertLevel === 'positive'
                ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-900'
                : 'bg-indigo-50 border-b border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs text-white ${
                  activeBond.alertLevel === 'danger'
                    ? 'bg-rose-600'
                    : activeBond.alertLevel === 'positive'
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600'
                }`}
              >
                !
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                {activeBond.alertText}
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/90 shadow-xs text-slate-600 font-medium border border-slate-200/60">
              실시간 DART 연동 반영됨
            </span>
          </div>

          {/* Card Header Info */}
          <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold tracking-tight shadow-xs">
                {activeBond.symbol}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                    {activeBond.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      activeBond.ratingStatus === 'danger'
                        ? 'bg-rose-100 text-rose-800'
                        : activeBond.ratingStatus === 'positive'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeBond.rating}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                    {activeBond.maturity}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#464555]">
                  {activeBond.coupon} · {activeBond.amount} · {activeBond.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="text-left lg:text-right">
                <span className="text-xs text-[#464555] block mb-0.5">나의 가상 매수일</span>
                <span className="text-sm font-semibold text-[#0b1c30]">
                  {activeBond.simulatedBuyDate}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-left lg:text-right">
                <span className="text-xs text-[#464555] block mb-0.5">신용위험 변동 점수</span>
                <span
                  className={`text-base sm:text-lg font-bold flex items-center gap-1 ${
                    activeBond.riskTrend === 'up'
                      ? 'text-rose-600'
                      : activeBond.riskTrend === 'positive'
                      ? 'text-indigo-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {activeBond.riskTrend === 'up' ? (
                    <TrendingDown size={18} className="text-rose-600" />
                  ) : (
                    <TrendingUp size={18} className="text-emerald-600" />
                  )}
                  {activeBond.riskDelta}
                </span>
              </div>
            </div>
          </div>

          {/* 3-LAYER TRANSPARENCY SHOWCASE CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-5 sm:p-6 md:p-8 bg-slate-50/70 border-b border-slate-100">
            {/* LAYER 1: Raw Facts [원문 사실] */}
            <div className="rounded-xl bg-white p-5 flex flex-col justify-between border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400 group-hover:bg-indigo-400 transition-colors" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                    <FileText size={14} className="text-slate-600" />
                    ① 원문 사실 (Fact)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeBond.fact.source}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  {activeBond.fact.quote}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onOpenDart(activeBond)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <span>DART 전자공시 원문 확인</span>
                  <ExternalLink size={13} />
                </button>
                <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  검증 완료 100%
                </span>
              </div>
            </div>

            {/* LAYER 2: Deterministic Metrics [정량 계산] */}
            <div className="rounded-xl bg-white p-5 flex flex-col justify-between border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                    <Calculator size={14} className="text-indigo-600" />
                    ② 정량 계산 (Formula)
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded">
                    수학적 검증
                  </span>
                </div>
                <div className="space-y-3.5 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600">{activeBond.formula.interestCoverStatus}</span>
                      <span
                        className={`font-bold ${
                          activeBond.formula.isInterestCoverDanger ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {activeBond.formula.interestCover}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeBond.formula.isInterestCoverDanger ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(activeBond.formula.interestCoverPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600">{activeBond.formula.debtRatioStatus}</span>
                      <span className="font-semibold text-slate-800">
                        {activeBond.formula.debtRatio}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(activeBond.formula.debtRatioPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{activeBond.formula.formulaExpr}</span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                  환각 배제 100%
                </span>
              </div>
            </div>

            {/* LAYER 3: AI Insights & Action [AI 해석] */}
            <div className="rounded-xl bg-gradient-to-b from-purple-50/60 via-white to-white p-5 flex flex-col justify-between border border-purple-200/80 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold">
                    <Sparkles size={14} className="text-purple-600" />
                    ③ AI 해석 및 액션 (Insight)
                  </span>
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    {activeBond.insight.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-3 bg-purple-50/40 p-3 rounded-lg border border-purple-100/60">
                  {activeBond.insight.summary}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-purple-600/90 leading-tight">
                  {activeBond.insight.disclaimer}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Action Bar */}
          <div className="px-6 md:px-8 py-4 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
              <CheckCircle2 size={19} className="text-emerald-600 shrink-0" />
              <span>이런 정밀 분석을 매일 아침 카카오톡 1장 요약으로 받아보세요.</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAlertSetup(activeBond.name)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow hover:shadow-md transition-all active:scale-[0.98]"
            >
              <span>내 보유 종목 알림 설정하기</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
