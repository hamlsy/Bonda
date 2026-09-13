import React from 'react';
import { FileText, Calculator, Sparkles, ShieldCheck } from 'lucide-react';

interface PillarLegendBarProps {
  onSelectTab?: (tab: 'raw_facts' | 'metrics' | 'ai_insights') => void;
}

export const PillarLegendBar: React.FC<PillarLegendBarProps> = ({ onSelectTab }) => {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-3 px-4 sm:px-6 shadow-sm border-b border-indigo-900/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white">채권 신용 3대 분석 원칙</span>
          <span className="hidden sm:inline text-slate-400">
            — 객관적 사실과 계산 지표, AI의 추론 영역을 투명하게 분리 제공합니다
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {/* Pillar 1: Raw Facts */}
          <button
            onClick={() => onSelectTab && onSelectTab('raw_facts')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/60 border border-indigo-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 font-bold text-[11px]">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-indigo-200 flex items-center gap-1">
                원문 사실 <span className="text-[10px] text-indigo-300 font-normal">Raw Facts</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">DART 공시 · 감사보고서 주석 원문</div>
            </div>
          </button>

          {/* Pillar 2: Deterministic Metrics */}
          <button
            onClick={() => onSelectTab && onSelectTab('metrics')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 font-bold text-[11px]">
              <Calculator className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-emerald-200 flex items-center gap-1">
                정량 계산 지표 <span className="text-[10px] text-emerald-300 font-normal">Deterministic</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">이자보상배율 · 부채비율 (오차 0%)</div>
            </div>
          </button>

          {/* Pillar 3: LLM Insights */}
          <button
            onClick={() => onSelectTab && onSelectTab('ai_insights')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-violet-200 flex items-center gap-1">
                AI 분석 리포트 <span className="text-[10px] text-violet-300 font-normal">LLM Insights</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">교차 검증 · 개인투자자 행동 가이드</div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
