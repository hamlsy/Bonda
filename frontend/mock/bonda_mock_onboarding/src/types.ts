export interface BondItem {
  id: string;
  symbol: string;
  name: string;
  company: string;
  rating: string;
  ratingStatus: 'positive' | 'stable' | 'negative' | 'danger';
  maturity: string;
  coupon: string;
  amount: string;
  type: string;
  simulatedBuyDate: string;
  riskDelta: string;
  riskTrend: 'up' | 'down' | 'safe' | 'positive';
  alertText: string;
  alertLevel: 'danger' | 'warning' | 'positive' | 'safe';
  fact: {
    title: string;
    source: string;
    quote: string;
    filingDate: string;
    filingNumber: string;
    verifiedPercent: number;
    detailedDARTExcerpt: string;
  };
  formula: {
    interestCover: string;
    interestCoverPercent: number;
    interestCoverStatus: string;
    isInterestCoverDanger: boolean;
    debtRatio: string;
    debtRatioPercent: number;
    debtRatioStatus: string;
    formulaExpr: string;
    verificationText: string;
  };
  insight: {
    badge: string;
    summary: string;
    strategy: string;
    disclaimer: string;
  };
  debtDelta: {
    buyRatio: number;
    currentRatio: number;
    delta: string;
  };
  recentFeeds: Array<{
    title: string;
    time: string;
    source: string;
  }>;
}

export interface UserRegisteredBond {
  id: string;
  bondName: string;
  buyDate: string;
  amountInvested: string;
  notifyOutlookChange: boolean;
  notifyDebtSurge: boolean;
  notifyDartDisclosure: boolean;
  contactChannel: 'kakao' | 'email' | 'both';
  contactValue: string;
  createdAt: string;
}
