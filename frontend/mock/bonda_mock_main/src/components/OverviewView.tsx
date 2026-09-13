import React from 'react';
import { CorporateBond, ActiveTab } from '../types';
import {
  FileText,
  Calculator,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  History,
  ShieldCheck,
  Quote,
} from 'lucide-react';

interface OverviewViewProps {
  bond: CorporateBond;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ bond, onNavigateTab }) => {
  const topSignal = bond.riskSignals[0];
  const latestFact = bond.rawFacts.disclosures[0];

  return (
    <div className="space-y-6">
      {/* Top Alert / Status Banner */}
      {topSignal && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
            topSignal.type === 'alert'
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : topSignal.type === 'watch'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">
              {topSignal.type === 'alert' && '🔴'}
              {topSignal.type === 'watch' && '🟡'}
              {topSignal.type === 'positive' && '🟢'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {topSignal.type === 'alert'
                    ? '신용위험 감지 신호'
                    : topSignal.type === 'watch'
                    ? '신용 관찰 신호'
                    : '신용 개선 신호'}
                </span>
                <span className="text-[11px] opacity-70">({topSignal.date})</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base mt-0.5">{topSignal.title}</h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{topSignal.description}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('timeline')}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-black/10 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>타임라인</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3 Pillars Visual Triad Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pillar 1: Raw Facts (Indigo) */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs flex flex-col justify-between hover:border-indigo-400 transition-all group">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">원문 사실 (Raw Facts)</h4>
                  <span className="text-[10px] text-indigo-600 font-semibold">100% 팩트 보장</span>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
                DART 공식
              </span>
            </div>

            <div className="my-4 space-y-3">
              {latestFact && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800 line-clamp-1">
                    {latestFact.title}
                  </div>
                  <p className="text-slate-600 line-clamp-3 text-[11px] italic">
                    &ldquo;{latestFact.originalQuote}&rdquo;
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    출처: {latestFact.source} ({latestFact.date})
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs px-2 py-1 bg-indigo-50/50 rounded-lg">
                <span className="text-slate-500">감사의견</span>
                <span className="font-bold text-indigo-950">
                  {bond.rawFacts.auditOpinion.opinion} ({bond.rawFacts.auditOpinion.auditor})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('raw_facts')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>공시 원문 및 주석 전체보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 2: Deterministic Metrics (Emerald) */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all group">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">정량 계산 지표</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold">오차 0% 확정치</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                수식 검증
              </span>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">이자보상배율 (ICR)</div>
                  <div className="text-sm font-bold text-slate-900">
                    {bond.deterministicMetrics.interestCoverageRatio.toFixed(2)}배
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    bond.deterministicMetrics.interestCoverageRatio < 1.0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {bond.deterministicMetrics.interestCoverageRatio < 1.0 ? '위험' : '안정'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">부채비율 (D/E)</div>
                  <div className="text-sm font-bold text-slate-900">
                    {bond.deterministicMetrics.debtToEquityRatio.toFixed(1)}%
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {bond.deterministicMetrics.debtToEquityRatio > 250 ? '과다' : '적정'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">순차입금 / EBITDA</div>
                  <div className="text-sm font-bold text-slate-900">
                    {bond.deterministicMetrics.netDebtToEbitda.toFixed(2)}배
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  상환소요 {bond.deterministicMetrics.netDebtToEbitda.toFixed(1)}년
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('metrics')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>상세 산출식 및 시뮬레이터</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pillar 3: LLM Insights (Violet) */}
        <div className="p-5 rounded-2xl bg-white border border-violet-200 shadow-xs flex flex-col justify-between hover:border-violet-400 transition-all group">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-violet-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">AI 분석 리포트</h4>
                  <span className="text-[10px] text-violet-600 font-semibold">Gemini 심층추론</span>
                </div>
              </div>
              <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono">
                개인투자자용
              </span>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200 text-xs">
                <div className="text-[10px] font-bold text-violet-700 uppercase">
                  {bond.aiInsights.riskLevel} 판정
                </div>
                <div className="text-sm font-extrabold text-violet-950 mt-0.5">
                  {bond.aiInsights.verdict}
                </div>
                <p className="text-[11px] text-violet-900/90 mt-1.5 line-clamp-2 leading-relaxed">
                  {bond.aiInsights.summary}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400">핵심 리스크 감지:</div>
                <div className="flex flex-wrap gap-1">
                  {bond.aiInsights.keyRisks.slice(0, 2).map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                    >
                      • {r.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ai_insights')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>AI 심층 리포트 및 질의응답</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Cashflow & Action Rules Teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cashflow quick view */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300">내 1,000만원 투자 시 예상 현금흐름</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-emerald-400 font-semibold">
              세후 실수령 기준
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-white/5 rounded-xl">
              <div className="text-[10px] text-slate-400">3개월 이자</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {Math.round((10000000 * (bond.couponRate / 100) * (1 - 0.154)) / 4).toLocaleString()}원
              </div>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl">
              <div className="text-[10px] text-slate-400">연간 총이자</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {Math.round(10000000 * (bond.couponRate / 100) * (1 - 0.154)).toLocaleString()}원
              </div>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl">
              <div className="text-[10px] text-slate-400">만기수익률</div>
              <div className="text-sm font-bold text-white mt-0.5">{bond.ytm.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Retail Rule Teaser */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">개인투자자 핵심 체크포인트</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {bond.aiInsights.retailInvestorGuidance[0] ||
                '신용평가사의 수시평가(Rating Watch) 공시 발생 시 즉시 스프레드 확대를 확인하세요.'}
            </p>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <span>나머지 2가지 행동 지침은 AI 리포트 탭에서 확인 가능</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
