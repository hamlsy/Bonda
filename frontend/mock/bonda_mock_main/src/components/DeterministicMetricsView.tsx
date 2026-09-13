import React, { useState } from 'react';
import { DeterministicMetricsData, MetricStatus } from '../types';
import {
  Calculator,
  Percent,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Coins,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DeterministicMetricsViewProps {
  metrics: DeterministicMetricsData;
  couponRate: number;
  ytm: number;
  remainingDays: number;
  marketPrice: number;
  parValue: number;
}

export const DeterministicMetricsView: React.FC<DeterministicMetricsViewProps> = ({
  metrics,
  couponRate,
  ytm,
  remainingDays,
  marketPrice,
  parValue,
}) => {
  // Retail investment simulator state
  const [investAmountTenThousand, setInvestAmountTenThousand] = useState<number>(1000); // 1,000만원
  const [taxExempt, setTaxExempt] = useState<boolean>(false);

  const investAmountWon = investAmountTenThousand * 10000;

  // Annual gross coupon interest
  const annualGrossInterest = Math.round(investAmountWon * (couponRate / 100));
  // Tax rate (15.4% or 0%)
  const taxRate = taxExempt ? 0 : 0.154;
  const annualNetInterest = Math.round(annualGrossInterest * (1 - taxRate));
  const quarterlyNetInterest = Math.round(annualNetInterest / 4);

  // Capital gain/loss at maturity (parValue 10,000 vs current marketPrice)
  const bondsQuantity = Math.floor(investAmountWon / marketPrice);
  const capitalGainAtMaturity = Math.round(bondsQuantity * (parValue - marketPrice));

  // Remaining years approx
  const remainingYears = remainingDays / 365;
  const totalInterestUntilMaturity = Math.round(annualNetInterest * remainingYears);
  const totalEstimatedReturn = totalInterestUntilMaturity + capitalGainAtMaturity;

  const getStatusBadge = (status: MetricStatus) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> 정상 안전
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> 유의 관찰
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> 위험 기준초과
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Domain Header Card */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            정량 계산 지표 (Deterministic Metrics) 검증 원칙
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 font-semibold">
              수학적 확정치 · 오차 0%
            </span>
          </div>
          <p className="text-emerald-900/80 mt-1 leading-relaxed">
            AI의 추론이나 자의적 해석이 개입되지 않은 표준 재무 회계 공식에 따라 산출된 객관적 숫자입니다.
            각 지표 카드를 통해 분자/분모 산출식과 한국신용평가사 기준 임계값을 즉시 대조할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Grid of Key Deterministic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. ICR */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">이자보상배율 (ICR)</span>
              {getStatusBadge(metrics.interestCoverageStatus)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  metrics.interestCoverageRatio < 1.0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {metrics.interestCoverageRatio.toFixed(2)}배
              </span>
              <span className="text-xs text-slate-400">
                {metrics.interestCoverageRatio < 1.0 ? '(이자비용 감당 불가)' : '(영업이익으로 이자 충당)'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-mono text-slate-700 font-medium truncate mb-1">
              산출: {metrics.interestCoverageFormula}
            </div>
            <div className="text-slate-400">기준: 1.0배 미만 시 한계기업 경고 / 2.0배 이상 안정</div>
          </div>
        </div>

        {/* 2. Debt to Equity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">부채비율 (Debt / Equity)</span>
              {getStatusBadge(metrics.debtToEquityStatus)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.debtToEquityRatio.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                {metrics.debtToEquityRatio > 250 ? '(레버리지 과다)' : '(적정 자본구조)'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-mono text-slate-700 font-medium truncate mb-1">
              산출: {metrics.debtToEquityFormula}
            </div>
            <div className="text-slate-400">기준: 200% 이하 양호 / 300% 이상 위험 구간</div>
          </div>
        </div>

        {/* 3. Net Debt / EBITDA */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">순차입금 / EBITDA</span>
              {getStatusBadge(metrics.netDebtToEbitdaStatus)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.netDebtToEbitda.toFixed(2)}배
              </span>
              <span className="text-xs text-slate-400">
                (차입금 전액상환 소요년수)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-mono text-slate-700 font-medium truncate mb-1">
              산출: {metrics.netDebtToEbitdaFormula}
            </div>
            <div className="text-slate-400">기준: 4.0배 이하 안정 / 6.0배 초과 시 차환 스트레스</div>
          </div>
        </div>

        {/* 4. Current Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">유동비율 (Current Ratio)</span>
              {getStatusBadge(metrics.currentRatioStatus)}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.currentRatio.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                (1년내 단기채무 지급능력)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-mono text-slate-700 font-medium truncate mb-1">
              산출: {metrics.currentRatioFormula}
            </div>
            <div className="text-slate-400">기준: 100% 이상 유동자산 상회 / 100% 미만 경계</div>
          </div>
        </div>

        {/* 5. Short Term Debt Ratio */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">단기차입금 비중</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  metrics.shortTermDebtRatio > 50
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {metrics.shortTermDebtRatio > 50 ? '만기집중 위험' : '만기분산 양호'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.shortTermDebtRatio.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                (1년 내 만기 차입금 비중)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-mono text-slate-700 font-medium truncate mb-1">
              총차입금 중 1년 내 도래 비중
            </div>
            <div className="text-slate-400">기준: 40% 이하 권고 / 50% 초과 시 유동성 롤오버 리스크</div>
          </div>
        </div>

        {/* 6. Altman Z-Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">알트만 Z-Score 부도위험 모형</span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Z-Score
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.altmanZScore.toFixed(2)}점
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <div className="text-slate-700 font-semibold mb-1">{metrics.altmanZInterpretation}</div>
            <div className="text-slate-400">안전권(Z&gt;2.99) · 회색지대(1.81~2.99) · 부도주의(Z&lt;1.81)</div>
          </div>
        </div>
      </div>

      {/* Retail Investor Interactive Cashflow Simulator */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                개인투자자 원리금 및 세후 이자 시뮬레이터
              </h4>
              <p className="text-xs text-slate-400">
                채권 매수 수량과 이자지급 주기에 따른 실제 계좌 입금액을 수학적으로 계산합니다.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
            <input
              type="checkbox"
              checked={taxExempt}
              onChange={(e) => setTaxExempt(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>비과세 / ISA 계좌 적용 (15.4% 감면)</span>
          </label>
        </div>

        {/* Amount Slider */}
        <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">내 투자 예정 금액 설정</span>
            <span className="text-lg font-extrabold text-emerald-400">
              {investAmountTenThousand.toLocaleString()}만원 ({investAmountWon.toLocaleString()}원)
            </span>
          </div>

          <input
            id="investment-slider"
            type="range"
            min={100}
            max={5000}
            step={100}
            value={investAmountTenThousand}
            onChange={(e) => setInvestAmountTenThousand(Number(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>최소 100만원</span>
            <span>1,000만원</span>
            <span>3,000만원</span>
            <span>최대 5,000만원</span>
          </div>
        </div>

        {/* Calculated Cashflows Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-[11px]">3개월마다 분기 세후 입금액</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {quarterlyNetInterest.toLocaleString()}원
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              (연간 총 {annualNetInterest.toLocaleString()}원)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-[11px]">만기까지 누적 세후 이자</div>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              {totalInterestUntilMaturity.toLocaleString()}원
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">잔여기간 약 {remainingYears.toFixed(1)}년 반영</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-[11px]">만기 원금 회수 차익 (단가차)</div>
            <div className="text-xl font-bold text-indigo-300 mt-1">
              {capitalGainAtMaturity > 0 ? `+${capitalGainAtMaturity.toLocaleString()}원` : '0원'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {marketPrice < parValue
                ? `단가 ${marketPrice}원 할인 매수 효과`
                : `현재 단가 ${marketPrice}원`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 border border-emerald-500/30">
            <div className="text-emerald-300 font-semibold text-[11px]">만기 총 예상 수령액</div>
            <div className="text-xl font-black text-white mt-1">
              {(investAmountWon + totalEstimatedReturn).toLocaleString()}원
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              총 수익 +{totalEstimatedReturn.toLocaleString()}원 (실효 {((totalEstimatedReturn / investAmountWon) * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
