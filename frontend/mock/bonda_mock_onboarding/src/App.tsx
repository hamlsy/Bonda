import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InteractiveReportSection } from './components/InteractiveReportSection';
import { WhyBondaSection } from './components/WhyBondaSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ComparisonSection } from './components/ComparisonSection';
import { QuickstartCtaSection } from './components/QuickstartCtaSection';
import { Footer } from './components/Footer';

import { DartModal } from './components/modals/DartModal';
import { KakaoModal } from './components/modals/KakaoModal';
import { RegisterBondModal } from './components/modals/RegisterBondModal';
import { PrinciplesModal } from './components/modals/PrinciplesModal';
import { PricingModal } from './components/modals/PricingModal';
import { LoginModal } from './components/modals/LoginModal';
import { TermsModal } from './components/modals/TermsModal';

import { INITIAL_BONDS } from './data/bonds';
import { BondItem, UserRegisteredBond } from './types';
import { CheckCircle2, Bell } from 'lucide-react';

export default function App() {
  const [bonds, setBonds] = useState<Record<string, BondItem>>(INITIAL_BONDS);
  const [activeBondId, setActiveBondId] = useState<string>('lotte');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [dartModalBond, setDartModalBond] = useState<BondItem | null>(null);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerModalInitialName, setRegisterModalInitialName] = useState('');
  const [isPrinciplesModalOpen, setIsPrinciplesModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectBond = (id: string) => {
    setActiveBondId(id);
  };

  const handleOpenDartModal = (bond: BondItem) => {
    setDartModalBond(bond);
  };

  const handleOpenRegister = (bondName?: string) => {
    setRegisterModalInitialName(bondName || '');
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = (data: {
    bondName: string;
    buyDate: string;
    notifyOutlookChange: boolean;
    notifyDebtSurge: boolean;
    notifyDartDisclosure: boolean;
    contactChannel: 'kakao' | 'email' | 'both';
    contactValue: string;
  }) => {
    setIsRegisterModalOpen(false);

    // Check if bond exists in our DB or create a new entry
    const existingKey = Object.keys(bonds).find(
      (key) => bonds[key].name.toLowerCase() === data.bondName.toLowerCase() ||
               bonds[key].company.toLowerCase() === data.bondName.toLowerCase()
    );

    if (existingKey) {
      setActiveBondId(existingKey);
    } else {
      // Create dynamically simulated bond entry
      const newId = `custom-${Date.now()}`;
      const companyPart = data.bondName.split(' ')[0] || data.bondName;
      const newBond: BondItem = {
        id: newId,
        symbol: companyPart.slice(0, 2).toUpperCase(),
        name: data.bondName,
        company: companyPart,
        rating: 'A+ / 안정적',
        ratingStatus: 'stable',
        maturity: '잔존 2년 0개월',
        coupon: '표면이율 4.20%',
        amount: '발행규모 2,000억 원',
        type: '무보증 공모사채',
        simulatedBuyDate: `${data.buyDate} (A+ 안정적)`,
        riskDelta: '+1.5% 안정적 유지',
        riskTrend: 'safe',
        alertText: `🔔 [정상 등록] ${data.bondName}: DART 공시 및 3대 신평사 24시간 실시간 감시 시작`,
        alertLevel: 'safe',
        fact: {
          title: 'DART 정기/수시공시 연동 활성화',
          source: 'DART 전자공시 연동',
          quote: `"${companyPart}의 최근 사업보고서 및 분기 차입금 변동 내역이 Bonda AI 모니터링 엔진에 즉시 연동되었습니다."`,
          filingDate: '실시간 연동 중',
          filingNumber: '2024-AUTO-REG',
          verifiedPercent: 100,
          detailedDARTExcerpt: `[금융감독원 DART 연동 확인서]
종목명: ${data.bondName}
등록일시: ${new Date().toLocaleString('ko-KR')}
감시 조건: 신평사 등급 아웃룩 변동, 이자보상배율 1배 미만, 부채비율 급증
알림 수신: ${data.contactChannel.toUpperCase()} (${data.contactValue})`
        },
        formula: {
          interestCover: '3.1배 (안전)',
          interestCoverPercent: 70,
          interestCoverStatus: '이자보상배율 (영업익/이자비용)',
          isInterestCoverDanger: false,
          debtRatio: '1.9배 (건전)',
          debtRatioPercent: 35,
          debtRatioStatus: '순차입금 / EBITDA',
          formulaExpr: '수식: EBIT ÷ 총이자비용',
          verificationText: '환각 배제 100%'
        },
        insight: {
          badge: 'Bonda AI 맞춤 모델',
          summary: `"${companyPart}에 대한 실시간 DART 공시 감시가 개시되었습니다. 유동성 위기 징후 및 신평사 아웃룩 변동 시 ${data.contactValue}로 즉각 1장 요약 브리핑이 발송됩니다."`,
          strategy: '만기 확정 이자 수취 유지',
          disclaimer: '* 본 해석은 AI가 생성한 참고 정보이며 법적 투자권유가 아닙니다.'
        },
        debtDelta: {
          buyRatio: 120,
          currentRatio: 118,
          delta: '▼ -2.0%p'
        },
        recentFeeds: [
          { title: `${companyPart} 신용 모니터링 센서 가동`, time: '방금 전', source: 'Bonda AI' },
          { title: 'DART 최신 공시 변동사항 스캔 완료', time: '1분 전', source: 'DART' }
        ]
      };

      setBonds((prev) => ({ ...prev, [newId]: newBond }));
      setActiveBondId(newId);
    }

    // Scroll to interactive preview
    const previewEl = document.getElementById('demo-preview');
    previewEl?.scrollIntoView({ behavior: 'smooth' });

    showToast(`🎉 '${data.bondName}'이(가) 등록되어 24시간 실시간 감시를 시작했습니다!`);
  };

  const handleLoginSuccess = (loggedInUser: { name: string; email: string }) => {
    setUser(loggedInUser);
    setIsLoginModalOpen(false);
    showToast(`환영합니다, ${loggedInUser.name}님! 로그인되었습니다.`);
  };

  const handleLogout = () => {
    setUser(null);
    showToast('로그아웃되었습니다.');
  };

  const activeBond = bonds[activeBondId] || Object.values(bonds)[0];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#0b1c30] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-indigo-500/40 text-xs sm:text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        onOpenRegister={() => handleOpenRegister(activeBond.name)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenPrinciples={() => setIsPrinciplesModalOpen(true)}
        onOpenAlerts={() => setIsKakaoModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onRegisterClick={() => handleOpenRegister(activeBond.name)}
          onDemoClick={() => {
            const el = document.getElementById('demo-preview');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Interactive 3-Layer Transparency Report Showcase */}
        <InteractiveReportSection
          bonds={bonds}
          activeBondId={activeBondId}
          onSelectBond={handleSelectBond}
          onOpenDart={handleOpenDartModal}
          onOpenAlertSetup={(bondName) => handleOpenRegister(bondName)}
        />

        {/* Why Bonda: 3 Core Value Pillars */}
        <WhyBondaSection
          activeBond={activeBond}
          onOpenPrinciples={() => setIsPrinciplesModalOpen(true)}
        />

        {/* How it Works: 3-Step Flow */}
        <HowItWorksSection
          onOpenRegister={() => handleOpenRegister('')}
          onOpenKakaoSample={() => setIsKakaoModalOpen(true)}
        />

        {/* Comparison: Legacy vs Bonda */}
        <ComparisonSection />

        {/* Onboarding Quick-Start CTA */}
        <QuickstartCtaSection
          onStartMonitoring={(bondName) => handleOpenRegister(bondName)}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenPrinciples={() => setIsPrinciplesModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenAlerts={() => setIsKakaoModalOpen(true)}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* Modals */}
      {dartModalBond && (
        <DartModal
          bond={dartModalBond}
          onClose={() => setDartModalBond(null)}
        />
      )}

      {isKakaoModalOpen && (
        <KakaoModal
          bond={activeBond}
          onClose={() => setIsKakaoModalOpen(false)}
          onConfirmSetup={() => {
            setIsKakaoModalOpen(false);
            handleOpenRegister(activeBond.name);
          }}
        />
      )}

      {isRegisterModalOpen && (
        <RegisterBondModal
          initialBondName={registerModalInitialName}
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmit={handleRegisterSubmit}
        />
      )}

      {isPrinciplesModalOpen && (
        <PrinciplesModal
          onClose={() => setIsPrinciplesModalOpen(false)}
        />
      )}

      {isPricingModalOpen && (
        <PricingModal
          onClose={() => setIsPricingModalOpen(false)}
          onSelectPlan={(plan) => {
            setIsPricingModalOpen(false);
            showToast(`${plan} 플랜 신청이 완료되었습니다!`);
          }}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isTermsModalOpen && (
        <TermsModal
          onClose={() => setIsTermsModalOpen(false)}
        />
      )}
    </div>
  );
}
