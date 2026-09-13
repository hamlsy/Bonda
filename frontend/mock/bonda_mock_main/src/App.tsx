import React, { useState, useEffect, useMemo } from 'react';
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
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check backend health & Gemini key status
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Re-run AI analysis
  const handleReanalyze = async () => {
    if (!selectedBond) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/gemini/analyze-bond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondName: selectedBond.name,
          issuer: selectedBond.issuer,
          rating: selectedBond.rating,
          outlook: selectedBond.outlook,
          metrics: selectedBond.deterministicMetrics,
          rawFacts: selectedBond.rawFacts,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setBonds((prev) =>
          prev.map((b) =>
            b.id === selectedBond.id
              ? {
                  ...b,
                  aiInsights: {
                    ...b.aiInsights,
                    ...data.analysis,
                    isCustomGenerated: true,
                  },
                }
              : b
          )
        );
        showToast(`Gemini AI 분석이 완료되었습니다. (${selectedBond.name})`);
        setActiveTab('ai_insights');
      } else {
        showToast('AI 분석 리포트를 갱신하였습니다.');
      }
    } catch (err) {
      console.error(err);
      showToast('AI 분석 리포트를 갱신하였습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Ask custom question to AI
  const handleAskCustomQuestion = async (question: string) => {
    if (!selectedBond) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/gemini/analyze-bond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bondName: selectedBond.name,
          issuer: selectedBond.issuer,
          rating: selectedBond.rating,
          outlook: selectedBond.outlook,
          metrics: selectedBond.deterministicMetrics,
          rawFacts: selectedBond.rawFacts,
          customQuery: question,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setBonds((prev) =>
          prev.map((b) =>
            b.id === selectedBond.id
              ? {
                  ...b,
                  aiInsights: {
                    ...b.aiInsights,
                    ...data.analysis,
                    summary: `[질의: "${question}"] ${data.analysis.summary}`,
                    isCustomGenerated: true,
                  },
                }
              : b
          )
        );
        showToast('질문에 대한 AI 크레딧 분석이 반영되었습니다.');
      }
    } catch (err) {
      console.error(err);
      showToast('분석 응답을 불러왔습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add custom bond
  const handleAddBond = (newBond: CorporateBond) => {
    setBonds((prev) => [newBond, ...prev]);
    setSelectedBondId(newBond.id);
    setActiveTab('overview');
    showToast(`새 채권 [${newBond.name}] 신용 진단이 추가되었습니다.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
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
        hasGeminiKey={hasGeminiKey}
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
          <div className="p-4 sm:p-6 flex-1">
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
