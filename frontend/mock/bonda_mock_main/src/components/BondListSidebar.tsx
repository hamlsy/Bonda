import React from 'react';
import {
  CorporateBond,
  RiskSeverity,
} from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Clock,
  Flame,
  FileText,
  Calculator,
  Sparkles,
  ArrowUpRight,
  Shield,
} from 'lucide-react';

interface BondListSidebarProps {
  bonds: CorporateBond[];
  selectedBondId: string;
  onSelectBond: (bondId: string) => void;
  filterCategory: string;
  onFilterChange: (cat: string) => void;
}

export const BondListSidebar: React.FC<BondListSidebarProps> = ({
  bonds,
  selectedBondId,
  onSelectBond,
  filterCategory,
  onFilterChange,
}) => {
  const getRatingBadgeStyle = (rating: string) => {
    if (rating.startsWith('AA')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (rating.startsWith('A')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (rating.startsWith('BBB')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getRiskLevelBadge = (level: RiskSeverity) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> 위험 경고
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3 h-3" /> 등급 주의
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> 관찰 요망
          </span>
        );
      case 'LOW':
      case 'STABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> 안정적
          </span>
        );
    }
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white border-r border-slate-200 shrink-0 h-full">
      {/* Filter Tabs Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-indigo-600" />
            <span>실시간 감시 채권 리스트</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">총 {bonds.length}종목</span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: '전체' },
            { id: 'signals', label: '🚨 위험신호' },
            { id: 'high_yield', label: '🚀 BBB급 고수익' },
            { id: 'investment', label: '💎 AA급 우량' },
            { id: 'short_term', label: '⏱️ 만기 1년내' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.id)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bond Cards Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {bonds.map((bond) => {
          const isSelected = bond.id === selectedBondId;
          const topSignal = bond.riskSignals[0];

          return (
            <div
              key={bond.id}
              id={`bond-card-${bond.id}`}
              onClick={() => onSelectBond(bond.id)}
              className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
              }`}
            >
              {/* Header: Issuer, Sector, Rating */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{bond.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {bond.sector}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{bond.issuer}</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getRatingBadgeStyle(
                        bond.rating
                      )}`}
                    >
                      {bond.rating}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        bond.outlook === '부정적' || bond.outlook === '부정적 검토(Watch)'
                          ? 'text-rose-600'
                          : bond.outlook === '긍정적'
                          ? 'text-emerald-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {bond.outlook}
                    </span>
                  </div>
                  {getRiskLevelBadge(bond.riskLevel)}
                </div>
              </div>

              {/* Yield & Spread Bar */}
              <div className="grid grid-cols-3 gap-2 my-2 py-1.5 px-2 bg-slate-50 rounded-lg text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">만기수익률(YTM)</div>
                  <div className="font-bold text-indigo-700 text-sm">{bond.ytm.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">표면금리</div>
                  <div className="font-semibold text-slate-800">{bond.couponRate.toFixed(2)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">스프레드</div>
                  <div className="font-semibold text-slate-800 flex items-center justify-end gap-0.5">
                    <span>{bond.creditSpreadBps}bp</span>
                    {bond.spreadChange30d > 0 ? (
                      <TrendingUp className="w-3 h-3 text-rose-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Top Risk Signal Preview Chip */}
              {topSignal && (
                <div
                  className={`mt-2 text-[11px] p-1.5 rounded-md flex items-start gap-1.5 ${
                    topSignal.type === 'alert'
                      ? 'bg-rose-50/80 text-rose-900 border border-rose-200/60'
                      : topSignal.type === 'watch'
                      ? 'bg-amber-50/80 text-amber-900 border border-amber-200/60'
                      : 'bg-emerald-50/80 text-emerald-900 border border-emerald-200/60'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {topSignal.type === 'alert' && '🔴'}
                    {topSignal.type === 'watch' && '🟡'}
                    {topSignal.type === 'positive' && '🟢'}
                  </span>
                  <div className="line-clamp-1 font-medium">{topSignal.title}</div>
                </div>
              )}

              {/* 3 Pillars Mini Indicators */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-600">
                    <FileText className="w-3 h-3 text-indigo-500" />
                    <span>원문 {bond.rawFacts.disclosures.length}건</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Calculator className="w-3 h-3 text-emerald-500" />
                    <span>ICR {bond.deterministicMetrics.interestCoverageRatio.toFixed(1)}x</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span>AI 리포트</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  잔여 {bond.remainingDays}일
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}

        {bonds.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            검색 결과와 일치하는 채권이 없습니다.
          </div>
        )}
      </div>
    </aside>
  );
};
