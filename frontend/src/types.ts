export type Issuer = {
  id: number;
  corpCode: string;
  name: string;
  stockCode: string | null;
};

export type Bond = {
  id: number;
  issuer: Issuer;
  isin: string;
  bondCode: string;
  name: string;
  issueDate: string;
  maturityDate: string;
  couponRate: number;
  creditRating: string;
  createdAt: string;
};

export type Holding = {
  id: number;
  bond: Bond;
  purchaseDate: string;
  purchaseAmount: number;
  createdAt: string;
};

export type WatchlistEntry = {
  id: number;
  bond: Bond;
  createdAt: string;
};

export type CreateHolding = {
  bondId: number;
  purchaseDate: string;
  purchaseAmount: string;
};

export type RiskState = "NORMAL" | "WATCH" | "CAUTION";

export type AlertSeverity = "INFO" | "WATCH" | "IMPORTANT";

export type AlertItem = {
  alertId: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  bondId: number;
  bondName: string;
  holdingId: number | null;
  watchlistId: number | null;
  riskEventId: number | null;
  riskChangeId: number | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  targetType: "RISK_EVENT" | "SINCE_BOUGHT" | "WATCHLIST";
  targetId: number;
};

export type MyBondSummary = {
  holdingId: number;
  bondId: number;
  bondName: string;
  issuerName: string;
  purchaseDate: string;
  purchaseAmount: number;
  currentRiskState: {
    overall: RiskState;
    snapshotDate: string;
    liquidity: RiskState;
    cashFlow: RiskState;
    leverage: RiskState;
    earnings: RiskState;
    credit: RiskState;
  } | null;
  latestRiskChange: {
    id: number;
    category: "LIQUIDITY" | "CASH_FLOW" | "LEVERAGE" | "EARNINGS" | "CREDIT";
    previousState: RiskState;
    currentState: RiskState;
    detectedAt: string;
  } | null;
  newEventCount: number;
  unreadAlertCount: number;
  latestAlert: AlertItem | null;
  latestActivityAt: string | null;
};

export type TimelineType = "PURCHASE" | "RISK_EVENT" | "RISK_CHANGE" | "FINANCIAL_CHANGE";

export type SinceBoughtTimelineItem = {
  date: string;
  type: TimelineType;
  title: string;
  summary: string;
  severity: RiskState | null;
  riskEventId: number | null;
  riskChangeId: number | null;
  evidenceAvailable: boolean;
};

export type FinancialChange = {
  metric: string;
  label: string;
  baselineValue: number;
  currentValue: number;
  changeRate: number | null;
  direction: "INCREASE" | "DECREASE";
  summary: string;
};

export type CurrentRiskState = {
  snapshotId: number;
  snapshotDate: string;
  liquidity: RiskState;
  cashFlow: RiskState;
  leverage: RiskState;
  earnings: RiskState;
  credit: RiskState;
  ruleVersion: string;
};

export type SinceBoughtResponse = {
  holding: {
    id: number;
    bondId: number;
    bondName: string;
    issuerId: number;
    issuerName: string;
    purchaseDate: string;
    purchaseAmount: number;
  };
  currentRiskState: CurrentRiskState | null;
  timeline: SinceBoughtTimelineItem[];
  financialChanges: FinancialChange[];
  financialContext: {
    baseline: { id: number; period: string; statementDate: string } | null;
    current: { id: number; period: string; statementDate: string } | null;
  };
  explanation: {
    status: "AVAILABLE" | "NOT_NEEDED" | "FAILED";
    summary: string | null;
    relatedEventIds: number[];
    relatedRiskChangeIds: number[];
    reused: boolean;
    model: string | null;
    promptVersion: string | null;
  };
  updatedAt: string;
};

export type RiskEventDetail = {
  id: number;
  eventType: string;
  eventDate: string | null;
  amount: number | null;
  currency: string | null;
  disclosureTitle: string;
  publishedAt: string;
  sourceReceiptNo: string;
  evidence: Array<{
    id: number;
    section: string | null;
    evidenceText: string;
    sourceUrl: string | null;
  }>;
};

export type HistoricalReplayResponse = {
  issuer: { id: number; name: string; corpCode: string };
  cutoffDate: string;
  disclosuresUsed: Array<{
    disclosureId: number;
    title: string;
    versionId: number;
    versionNumber: number;
    versionPublishedAt: string;
  }>;
  riskEvents: Array<{
    id: number;
    sourceVersionId: number;
    eventType: string;
    eventDate: string | null;
    effectiveDate: string;
    sourcePublishedAt: string;
    evidenceText: string;
  }>;
  financialSnapshot: {
    id: number;
    period: string;
    statementDate: string;
    publishedOn: string;
  } | null;
  riskSnapshot: {
    asOf: string;
    overall: RiskState;
    liquidity: RiskState;
    cashFlow: RiskState;
    leverage: RiskState;
    earnings: RiskState;
    credit: RiskState;
    ruleVersion: string;
  };
  riskChanges: Array<{
    detectedOn: string;
    category: "LIQUIDITY" | "CASH_FLOW" | "LEVERAGE" | "EARNINGS" | "CREDIT";
    previousState: RiskState;
    currentState: RiskState;
  }>;
  timeline: Array<{
    date: string;
    type: "DISCLOSURE" | "RISK_EVENT" | "FINANCIAL_SNAPSHOT" | "RISK_CHANGE";
    title: string;
    summary: string;
    sourceId: number | null;
    riskEventId: number | null;
  }>;
  metadata: {
    riskRuleVersion: string;
    promptVersions: string[];
    models: string[];
    inputFingerprint: string;
    executedAt: string;
    executionTimeMs: number;
  };
};
