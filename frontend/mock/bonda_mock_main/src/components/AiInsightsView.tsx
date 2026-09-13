import React, { useState } from 'react';
import { AiInsightsData, RiskSeverity } from '../types';
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  Send,
  Loader2,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface AiInsightsViewProps {
  insights: AiInsightsData;
  onAskCustomQuestion: (question: string) => Promise<void>;
  isAsking: boolean;
  bondName: string;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  insights,
  onAskCustomQuestion,
  isAsking,
  bondName,
}) => {
  const [customQuery, setCustomQuery] = useState('');

  const handlePresetClick = (preset: string) => {
    setCustomQuery(preset);
    onAskCustomQuestion(preset);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isAsking) return;
    onAskCustomQuestion(customQuery.trim());
  };

  const getVerdictStyle = (verdict: string, level: RiskSeverity) => {
    if (level === 'CRITICAL' || verdict.includes('경고') || verdict.includes('자제')) {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-950',
        badge: 'bg-rose-600 text-white',
        icon: AlertOctagon,
      };
    }
    if (level === 'ALERT' || level === 'WATCH' || verdict.includes('조건부') || verdict.includes('주의')) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-950',
        badge: 'bg-amber-600 text-white',
        icon: AlertTriangle,
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      icon: CheckCircle,
    };
  };

  const style = getVerdictStyle(insights.verdict, insights.riskLevel);
  const VerdictIcon = style.icon;

  return (
    <div className="space-y-6">
      {/* Domain Philosophy Card */}
      <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex items-start gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-violet-950 text-sm flex items-center gap-2">
            AI 분석 리포트 (LLM Insights) 검증 원칙
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-200/60 text-violet-800 font-semibold">
              Gemini 3.8 AI 심층 추론
            </span>
          </div>
          <p className="text-violet-900/80 mt-1 leading-relaxed">
            원문 공시 사실(Raw Facts)과 정량 지표(Deterministic Metrics)를 교차 대조하여 숨겨진 우발채무,
            단기 리파이낸싱 스트레스, 그룹 지원 가능성을 종합 분석한 개인투자자 맞춤형 인사이트입니다.
          </p>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs ${style.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${style.badge}`}>
              {insights.riskLevel} RISK
            </span>
            <span className="text-xs font-semibold text-slate-500">종합 크레딧 판정</span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            분석 시점: {new Date(insights.generatedAt).toLocaleString('ko-KR')}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <VerdictIcon className="w-6 h-6 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">{insights.verdict}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{insights.summary}</p>
          </div>
        </div>
      </div>

      {/* Key Risks Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-600"></span>
          핵심 신용 리스크 요인 3가지 (Downside Drivers)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.keyRisks.map((risk, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400">RISK #{index + 1}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      risk.severity === 'danger'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : risk.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {risk.severity === 'danger'
                      ? '주의 경보'
                      : risk.severity === 'warning'
                      ? '모니터링'
                      : '일반 안내'}
                  </span>
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">{risk.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{risk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debt Servicing Capacity */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
            원리금 상환 재원 및 차환 가능성 점검 (Debt Servicing)
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            상환능력: {insights.debtServicingCapacity.assessment}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">가용 현금 및 단기 유동성 버퍼</div>
            <p className="text-slate-600 leading-relaxed">
              {insights.debtServicingCapacity.cashAndEquivalentsNote}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">만기 도래 시 리파이낸싱(차환) 전망</div>
            <p className="text-slate-600 leading-relaxed">
              {insights.debtServicingCapacity.refinancingFeasibility}
            </p>
          </div>
        </div>
      </div>

      {/* Retail Investor Action Guide */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xs">
        <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          개인투자자 실전 대응 가이드 (Retail Action Rules)
        </h4>

        <div className="space-y-2.5 text-xs sm:text-sm">
          {insights.retailInvestorGuidance.map((guide, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-slate-200 leading-relaxed">{guide}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Credit Q&A Section */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h4 className="text-sm font-bold">채권 전문 AI에게 추가 질문하기</h4>
        </div>
        <p className="text-xs text-slate-500">
          아래 추천 질문을 누르거나, 개인적으로 궁금한 우발채무나 상환 리스크를 직접 질문해보세요.
        </p>

        {/* Preset Question Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            '단기사채 차환 실패 시 파급효과는?',
            '계열사 지원 가능성 및 담보 안정성은?',
            '장내 채권 매도 vs 만기보유 중 무엇이 유리한가?',
            '신용등급 1단계 강등 시 예상 채권 가격 하락폭은?',
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              disabled={isAsking}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 border border-slate-200 text-slate-700 font-medium transition-all text-[11px] disabled:opacity-50 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <form onSubmit={handleFormSubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder={`예: ${bondName}의 최악의 시나리오(신용등급 강등) 시 개인투자자 손실율은?`}
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            disabled={isAsking}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 text-xs sm:text-sm outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isAsking || !customQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            {isAsking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>분석중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>질문하기</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
