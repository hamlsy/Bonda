import React from 'react';
import { CorporateBond, ActiveTab } from '../types';
import {
  Sparkles,
  Building2,
  Calendar,
  Layers,
  ArrowRightLeft,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Calculator,
  History,
  TrendingUp,
} from 'lucide-react';

interface BondHeaderProps {
  bond: CorporateBond;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

export const BondHeader: React.FC<BondHeaderProps> = ({
  bond,
  activeTab,
  onTabChange,
  onReanalyze,
  isAnalyzing,
}) => {
  const getRatingStyle = (rating: string) => {
    if (rating.startsWith('AA')) return 'bg-emerald-600 text-white';
    if (rating.startsWith('A')) return 'bg-blue-600 text-white';
    if (rating.startsWith('BBB')) return 'bg-amber-600 text-white';
    return 'bg-rose-600 text-white';
  };

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Issuer Info */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                {bond.sector}
              </span>
              <span className="text-xs text-slate-400 font-mono">종목코드 {bond.ticker}</span>
              <span className="text-xs text-slate-400">발행규모 {bond.issueAmount}</span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {bond.name}
              </h1>
              <span className="text-sm font-medium text-slate-500">({bond.issuer})</span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                만기일 {bond.maturityDate}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-indigo-600">잔존 {bond.remainingDays}일</span>
              <span className="text-slate-300">•</span>
              <span>평가기관: {bond.ratingAgency}</span>
            </div>
          </div>

          {/* Quick Metrics & Reanalyze Action */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Credit Rating Card */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-base shadow-xs ${getRatingStyle(
                  bond.rating
                )}`}
              >
                <span>{bond.rating}</span>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">신용등급 및 전망</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <span>{bond.rating}</span>
                  <span
                    className={`text-xs font-semibold ${
                      bond.outlook === '부정적' || bond.outlook === '부정적 검토(Watch)'
                        ? 'text-rose-600'
                        : bond.outlook === '긍정적'
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                    }`}
                  >
                    ({bond.outlook})
                  </span>
                </div>
              </div>
            </div>

            {/* Yield / Market Price Card */}
            <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">만기수익률(YTM)</div>
                <div className="text-base font-extrabold text-indigo-700">
                  {bond.ytm.toFixed(2)}%
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">현재 채권단가</div>
                <div className="text-sm font-bold text-slate-800">
                  {bond.marketPrice.toLocaleString()}원
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />
              <div className="hidden sm:block">
                <div className="text-[10px] text-slate-400 font-medium">크레딧 스프레드</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <span>+{bond.creditSpreadBps}bp</span>
                  <span
                    className={`text-[11px] ${
                      bond.spreadChange30d > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ({bond.spreadChange30d > 0 ? `+${bond.spreadChange30d}` : bond.spreadChange30d}bp)
                  </span>
                </div>
              </div>
            </div>

            {/* Reanalyze AI Button */}
            <button
              id="reanalyze-ai-btn"
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              title="최신 공시와 정량 지표를 바탕으로 Gemini AI 크레딧 리포트를 재작성합니다"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'AI 심층 추론중...' : 'AI 실시간 재분석'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1.5 mt-5 border-t border-slate-100 pt-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview' as ActiveTab, label: '종합 개요 (Overview)', icon: Layers },
            {
              id: 'raw_facts' as ActiveTab,
              label: '원문 사실 (Raw Facts)',
              icon: FileText,
              badge: '공시·주석',
              badgeColor: 'bg-indigo-100 text-indigo-700',
            },
            {
              id: 'metrics' as ActiveTab,
              label: '정량 계산 지표 (Deterministic)',
              icon: Calculator,
              badge: '수식 검증',
              badgeColor: 'bg-emerald-100 text-emerald-700',
            },
            {
              id: 'ai_insights' as ActiveTab,
              label: 'AI 분석 리포트 (LLM Insights)',
              icon: Sparkles,
              badge: 'Gemini',
              badgeColor: 'bg-violet-100 text-violet-700',
            },
            {
              id: 'timeline' as ActiveTab,
              label: '위험 신호 & 타임라인 (Timeline)',
              icon: History,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
