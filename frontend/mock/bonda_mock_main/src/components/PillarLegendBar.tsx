import React from 'react';
import { FileText, Calculator, Sparkles, ShieldCheck } from 'lucide-react';

interface PillarLegendBarProps {
  onSelectTab?: (tab: 'raw_facts' | 'metrics' | 'ai_insights') => void;
}

export const PillarLegendBar: React.FC<PillarLegendBarProps> = ({ onSelectTab }) => {
  return (
    <section className="bonda-pillars bg-white py-3 px-4 sm:px-6 border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="font-semibold text-slate-900">분석 근거 구분</span>
          <span className="hidden sm:inline text-slate-500">
            사실, 계산, AI 해석을 구분해 표시합니다
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Pillar 1: Raw Facts */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('raw_facts')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-xs">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                원문 사실 <span className="hidden xl:inline text-xs text-slate-400 font-normal">Raw Facts</span>
              </div>
              <div className="hidden md:block text-xs text-slate-500 leading-tight">공시 · 감사보고서 원문</div>
            </div>
          </button>

          {/* Pillar 2: Deterministic Metrics */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('metrics')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs">
              <Calculator className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                정량 지표 <span className="hidden xl:inline text-xs text-slate-400 font-normal">Deterministic</span>
              </div>
              <div className="hidden md:block text-xs text-slate-500 leading-tight">검증 가능한 수식 결과</div>
            </div>
          </button>

          {/* Pillar 3: LLM Insights */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('ai_insights')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center text-violet-700 shrink-0 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                AI 해석 <span className="hidden xl:inline text-xs text-slate-400 font-normal">LLM Insights</span>
              </div>
              <div className="hidden md:block text-xs text-slate-500 leading-tight">근거 기반 참고 해석</div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
