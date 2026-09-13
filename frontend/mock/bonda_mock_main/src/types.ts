export type RiskSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'STABLE'
  | 'WATCH'
  | 'ALERT'
  | 'CRITICAL';
export type SignalType = 'alert' | 'watch' | 'positive';
export type MetricStatus = 'healthy' | 'caution' | 'danger';

export interface RiskSignal {
  id: string;
  type: SignalType;
  title: string;
  description: string;
  date: string;
  metricTrigger?: string;
}

export interface DisclosureFact {
  id: string;
  date: string;
  title: string;
  source: 'DART 전자공시' | '감사보고서 주석' | '신평사 평가서' | '사채관리계약서';
  originalQuote: string;
  isKeyTrigger?: boolean;
  documentNumber?: string;
}

export interface RawFactsData {
  disclosures: DisclosureFact[];
  auditOpinion: {
    opinion: '적정' | '한정' | '부적정' | '의견거절';
    auditor: string;
    fiscalYear: string;
    emphasisOfMatter: string;
  };
  contingentLiabilities: {
    totalGuarantees: string; // e.g. "1조 4,200억원"
    pledgedAssets: string; // 담보제공자산
    litigationRisk: string; // 소송 및 우발채무
  };
}

export interface DeterministicMetricsData {
  interestCoverageRatio: number; // 배
  interestCoverageFormula: string;
  interestCoverageStatus: MetricStatus;

  debtToEquityRatio: number; // %
  debtToEquityFormula: string;
  debtToEquityStatus: MetricStatus;

  netDebtToEbitda: number; // 배
  netDebtToEbitdaFormula: string;
  netDebtToEbitdaStatus: MetricStatus;

  currentRatio: number; // %
  currentRatioFormula: string;
  currentRatioStatus: MetricStatus;

  borrowingDependence: number; // %
  borrowingDependenceFormula: string;
  borrowingDependenceStatus: MetricStatus;

  altmanZScore: number;
  altmanZInterpretation: string;

  shortTermDebtRatio: number; // 총차입금 중 1년내 만기도래 비중 (%)
}

export interface AiKeyRisk {
  title: string;
  description: string;
  severity: 'warning' | 'danger' | 'info';
}

export interface AiInsightsData {
  summary: string;
  verdict: string;
  riskLevel: RiskSeverity;
  keyRisks: AiKeyRisk[];
  debtServicingCapacity: {
    assessment: string;
    cashAndEquivalentsNote: string;
    refinancingFeasibility: string;
  };
  retailInvestorGuidance: string[];
  generatedAt: string;
  isCustomGenerated?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  eventType: 'RATING_CHANGE' | 'DISCLOSURE' | 'FINANCIAL_REPORT' | 'MARKET_SPIKE' | 'CAPITAL_INCREASE';
  title: string;
  summary: string;
  impact: 'negative' | 'neutral' | 'positive';
  relatedFactQuote?: string;
  metricChange?: string;
}

export interface CorporateBond {
  id: string;
  name: string;
  issuer: string;
  ticker: string;
  sector: string;
  rating: string;
  ratingAgency: string;
  outlook: '안정적' | '부정적' | '긍정적' | '부정적 검토(Watch)' | '워크아웃';
  issueDate: string;
  maturityDate: string;
  remainingDays: number;
  couponRate: number; // %
  ytm: number; // %
  creditSpreadBps: number; // bp
  spreadChange30d: number; // bp
  issueAmount: string;
  parValue: number; // 액면가 (보통 10,000원)
  marketPrice: number; // 현재 단가 (예: 9,820원)
  riskLevel: RiskSeverity;
  riskSignals: RiskSignal[];
  rawFacts: RawFactsData;
  deterministicMetrics: DeterministicMetricsData;
  aiInsights: AiInsightsData;
  timelineEvents: TimelineEvent[];
}

export type ActiveTab = 'overview' | 'raw_facts' | 'metrics' | 'ai_insights' | 'timeline';
