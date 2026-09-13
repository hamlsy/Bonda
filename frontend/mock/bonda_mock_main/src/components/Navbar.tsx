import React from 'react';
import {
  ShieldAlert,
  Search,
  Sparkles,
  PlusCircle,
  TrendingUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSimulator: () => void;
  onOpenLegend: () => void;
  hasGeminiKey: boolean;
  totalBondsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSimulator,
  onOpenLegend,
  hasGeminiKey,
  totalBondsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                BondCredit <span className="text-indigo-600">AI</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                개인투자자용
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>장외채권 시장 실시간 모니터링중</span>
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-700">국고채 3년 3.12%</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="bond-search-input"
            type="text"
            placeholder="채권명, 발행사(예: 롯데케미칼, 한화), 등급(AA-, BBB)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-900 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Actions & Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="open-legend-btn"
            onClick={onOpenLegend}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>3대 프레임워크 안내</span>
          </button>

          <button
            id="open-simulator-btn"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>채권 직접 진단</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span className="font-medium text-slate-700">Gemini 3.8</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={hasGeminiKey ? 'Gemini API 활성화됨' : '기본 분석 모드 활성'}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
