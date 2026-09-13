import React from 'react';
import { Search, PlusCircle, TrendingUp, Info, X } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSimulator: () => void;
  onOpenLegend: () => void;
  totalBondsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSimulator,
  onOpenLegend,
  totalBondsCount,
}) => {
  return (
    <header className="bonda-navbar sticky top-0 z-40 bg-white/95 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 grid grid-cols-[1fr_auto] md:grid-cols-[auto_minmax(16rem,1fr)_auto] items-center gap-3">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Bonda
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                데모
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{totalBondsCount}개 샘플 종목 · 저장되지 않음</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative col-span-2 md:col-span-1 md:max-w-md md:justify-self-center w-full order-3 md:order-none">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="bond-search-input"
            type="text"
            placeholder="채권명, 발행사(예: 롯데케미칼, 한화), 등급(AA-, BBB)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="채권 검색"
            className="w-full pl-9 pr-10 py-2 bg-slate-50 focus:bg-white text-sm text-slate-900 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button type="button" onClick={() => onSearchChange('')} aria-label="검색어 지우기" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions & Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="open-legend-btn"
            onClick={onOpenLegend}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>3대 프레임워크 안내</span>
          </button>

          <button
            type="button"
            id="open-simulator-btn"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">채권 직접 진단</span>
            <span className="sm:hidden">추가</span>
          </button>

        </div>
      </div>
    </header>
  );
};
