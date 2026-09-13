import React, { useState, useMemo, useRef } from 'react';
import { CorporateBond, ActiveTab } from './types';
import { MOCK_BONDS } from './data/mockBonds';
import { Navbar } from './components/Navbar';
import { PillarLegendBar } from './components/PillarLegendBar';
import { BondListSidebar } from './components/BondListSidebar';
import { BondHeader } from './components/BondHeader';
import { OverviewView } from './components/OverviewView';
import { RawFactsView } from './components/RawFactsView';
import { DeterministicMetricsView } from './components/DeterministicMetricsView';
import { AiInsightsView } from './components/AiInsightsView';
import { RiskSignalsTimelineView } from './components/RiskSignalsTimelineView';
import { CustomBondModal } from './components/CustomBondModal';
import { FrameworkLegendModal } from './components/FrameworkLegendModal';

export default function App() {
  const [bonds, setBonds] = useState<CorporateBond[]>(MOCK_BONDS);
  const [selectedBondId, setSelectedBondId] = useState<string>(MOCK_BONDS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals & Async States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered bonds based on search and category
  const filteredBonds = useMemo(() => {
    return bonds.filter((b) => {
      // Search filter
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.rating.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.sector.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory === 'signals') {
        return (
          b.riskLevel === 'ALERT' ||
          b.riskLevel === 'CRITICAL' ||
          b.outlook === '부정적' ||
          b.outlook.includes('Watch')
        );
      }
      if (filterCategory === 'high_yield') {
        return b.rating.startsWith('BBB') || b.rating.startsWith('BB');
      }
      if (filterCategory === 'investment') {
        return b.rating.startsWith('AA');
      }
      if (filterCategory === 'short_term') {
        return b.remainingDays <= 365;
      }
      return true;
    });
  }, [bonds, searchQuery, filterCategory]);

  const selectedBond = useMemo(() => {
    return bonds.find((b) => b.id === selectedBondId) || bonds[0];
  }, [bonds, selectedBondId]);

  // Demo-only interaction until a verified analysis API is connected.
  const handleReanalyze = async () => {
    if (!selectedBond) return;
    setIsAnalyzing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setActiveTab('ai_insights');
    showToast(`${selectedBond.name}의 데모 분석 화면을 열었습니다. 서버에는 저장되지 않습니다.`);
    setIsAnalyzing(false);
  };

  // Preserve the planned interaction without claiming a server-generated answer.
  const handleAskCustomQuestion = async (question: string) => {
    if (!selectedBond) return;
    setIsAnalyzing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    showToast(`“${question}” 질문이 데모로 접수되었습니다. 실제 AI 연결은 개발 예정입니다.`);
    setIsAnalyzing(false);
  };

  // Add custom bond
  const handleAddBond = (newBond: CorporateBond) => {
    setBonds((prev) => [newBond, ...prev]);
    setSelectedBondId(newBond.id);
    setActiveTab('overview');
    showToast(`${newBond.name} 데모 진단을 추가했습니다. 새로고침하면 초기화됩니다.`);
  };

  return (
    <div className="bonda-product min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenLegend={() => setIsLegendOpen(true)}
        totalBondsCount={bonds.length}
      />

      {/* 3 Pillars Visual Triad Legend Bar */}
      <PillarLegendBar
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row shadow-sm border-x border-slate-200/60 bg-white">
        {/* Left Sidebar: Bond Watchlist & Risk Signals */}
        <BondListSidebar
          bonds={filteredBonds}
          selectedBondId={selectedBond.id}
          onSelectBond={(id) => {
            setSelectedBondId(id);
          }}
          filterCategory={filterCategory}
          onFilterChange={setFilterCategory}
        />

        {/* Right Detail Pane */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-50/40 overflow-y-auto">
          {/* Header of selected bond */}
          <BondHeader
            bond={selectedBond}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onReanalyze={handleReanalyze}
            isAnalyzing={isAnalyzing}
          />

          {/* Tab Content View */}
          <div role="tabpanel" aria-labelledby={`tab-btn-${activeTab}`} className="p-4 sm:p-6 flex-1">
            {activeTab === 'overview' && (
              <OverviewView bond={selectedBond} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'raw_facts' && (
              <RawFactsView
                rawFacts={selectedBond.rawFacts}
                issuerName={selectedBond.issuer}
              />
            )}

            {activeTab === 'metrics' && (
              <DeterministicMetricsView
                metrics={selectedBond.deterministicMetrics}
                couponRate={selectedBond.couponRate}
                ytm={selectedBond.ytm}
                remainingDays={selectedBond.remainingDays}
                marketPrice={selectedBond.marketPrice}
                parValue={selectedBond.parValue}
              />
            )}

            {activeTab === 'ai_insights' && (
              <AiInsightsView
                insights={selectedBond.aiInsights}
                onAskCustomQuestion={handleAskCustomQuestion}
                isAsking={isAnalyzing}
                bondName={selectedBond.name}
              />
            )}

            {activeTab === 'timeline' && (
              <RiskSignalsTimelineView
                signals={selectedBond.riskSignals}
                timeline={selectedBond.timelineEvents}
                bondName={selectedBond.name}
              />
            )}
          </div>
        </section>
      </main>

      {/* Custom Bond Diagnosis Simulator Modal */}
      <CustomBondModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onAddBond={handleAddBond}
      />

      {/* Framework Legend Modal */}
      <FrameworkLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />
    </div>
  );
}
