import React, { useState } from 'react';
import { CorporateBond, RiskSeverity } from '../types';
import { X, Sparkles, PlusCircle, Calculator, FileText, CheckCircle2 } from 'lucide-react';

interface CustomBondModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBond: (bond: CorporateBond) => void;
}

export const CustomBondModal: React.FC<CustomBondModalProps> = ({
  isOpen,
  onClose,
  onAddBond,
}) => {
  const [bondName, setBondName] = useState('CJ CGV 35');
  const [issuer, setIssuer] = useState('CJ CGV');
  const [sector, setSector] = useState('미디어 · 엔터');
  const [rating, setRating] = useState('BBB+');
  const [outlook, setOutlook] = useState<'안정적' | '부정적' | '긍정적' | '부정적 검토(Watch)'>('부정적');
  const [couponRate, setCouponRate] = useState(6.25);
  const [debtRatio, setDebtRatio] = useState(380);
  const [operatingProfit, setOperatingProfit] = useState(480); // 억원
  const [interestExpense, setInterestExpense] = useState(520); // 억원
  const [disclosureText, setDisclosureText] = useState(
    '자회사 CJ올리브네트웍스 지분 현물출자 완료 및 전환사채(CB) 조기상환 청구권(풋옵션) 행사 도래.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const icr = operatingProfit / (interestExpense || 1);
    const icrStatus = icr < 1.0 ? 'danger' : icr < 1.8 ? 'caution' : 'healthy';
    const debtStatus = debtRatio > 300 ? 'danger' : debtRatio > 200 ? 'caution' : 'healthy';

    const newBondId = `custom-${Date.now()}`;
    const newBond: CorporateBond = {
      id: newBondId,
      name: bondName,
      issuer: issuer,
      ticker: 'CUSTOM',
      sector: sector,
      rating: rating,
      ratingAgency: '한국기업평가 · NICE신용평가',
      outlook: outlook,
      issueDate: '2024-04-10',
      maturityDate: '2026-04-10',
      remainingDays: 415,
      couponRate: couponRate,
      ytm: Number((couponRate * 1.08).toFixed(2)),
      creditSpreadBps: 310,
      spreadChange30d: 15,
      issueAmount: '1,200억원',
      parValue: 10000,
      marketPrice: 9860,
      riskLevel: icr < 1.0 || outlook.includes('부정적') ? 'ALERT' : 'WATCH',
      riskSignals: [
        {
          id: `sig-${Date.now()}-1`,
          type: icr < 1.0 ? 'alert' : 'watch',
          title: icr < 1.0 ? '이자보상배율 1.0배 미달 유의' : '부채비율 레버리지 모니터링',
          description: `입력된 재무 수치상 영업이익(${operatingProfit}억원) 대비 이자비용(${interestExpense}억원) ICR이 ${icr.toFixed(
            2
          )}배로 산출되었습니다.`,
          date: new Date().toISOString().split('T')[0],
          metricTrigger: `이자보상배율 ${icr.toFixed(2)}배 / 부채비율 ${debtRatio}%`,
        },
      ],
      rawFacts: {
        disclosures: [
          {
            id: `df-${Date.now()}-1`,
            date: new Date().toISOString().split('T')[0],
            title: `[DART 공시] ${issuer} 주요사항보고서 및 주석 원문`,
            source: 'DART 전자공시',
            originalQuote: disclosureText,
            isKeyTrigger: true,
            documentNumber: '20250220000128',
          },
        ],
        auditOpinion: {
          opinion: '적정',
          auditor: '대형 회계법인',
          fiscalYear: '최근 사업연도',
          emphasisOfMatter: '전환사채 조기상환 청구권 행사 및 차환 계획 주석 참조.',
        },
        contingentLiabilities: {
          totalGuarantees: '해외법인 지급보증 약 2,400억원',
          pledgedAssets: '국내외 극장 자산 및 영화관 임차보증금',
          litigationRisk: '통상적인 영업상 소송 건',
        },
      },
      deterministicMetrics: {
        interestCoverageRatio: Number(icr.toFixed(2)),
        interestCoverageFormula: `영업손익 (${operatingProfit}억원) ÷ 이자비용 (${interestExpense}억원) = ${icr.toFixed(
          2
        )}배`,
        interestCoverageStatus: icrStatus,

        debtToEquityRatio: debtRatio,
        debtToEquityFormula: `총부채 대비 자기자본 비율 = ${debtRatio}%`,
        debtToEquityStatus: debtStatus,

        netDebtToEbitda: 5.2,
        netDebtToEbitdaFormula: '순차입금 ÷ EBITDA = 약 5.2배',
        netDebtToEbitdaStatus: 'caution',

        currentRatio: 110.5,
        currentRatioFormula: '유동자산 ÷ 유동부채 = 110.5%',
        currentRatioStatus: 'healthy',

        borrowingDependence: 48.0,
        borrowingDependenceFormula: '총차입금 ÷ 총자산 = 48.0%',
        borrowingDependenceStatus: 'caution',

        altmanZScore: 1.68,
        altmanZInterpretation: '회색 경계권역 (부채비율 완화 및 영업흑자 기조 유지 관찰)',

        shortTermDebtRatio: 45.0,
      },
      aiInsights: {
        summary: `${issuer}(${bondName})의 신용위험은 현재 신용등급 [${rating} / ${outlook}] 상태에서 정량 지표상 이자보상배율(${icr.toFixed(
          2
        )}배)과 부채비율(${debtRatio}%)을 고려할 때 ${
          icr < 1.0 ? '이자 상환 부담이 가중된 상태로 단기 차환 리스크에 주의가 필요합니다.' : '점진적 턴어라운드가 기대되나 만기 분산 구조를 점검해야 합니다.'
        }`,
        verdict: icr < 1.0 || outlook.includes('부정적') ? '주의 관망 (위험 경보)' : '조건부 만기보유 적합',
        riskLevel: icr < 1.0 ? 'ALERT' : 'WATCH',
        keyRisks: [
          {
            title: '이자보상배율 한계 구간',
            description: `영업이익으로 금융비용을 상회하기 위한 조업도 회복 속도 점검.`,
            severity: icr < 1.0 ? 'danger' : 'warning',
          },
          {
            title: '만기 차환 및 유동성',
            description: '1년 내 도래하는 회사채 롤오버 성공 여부.',
            severity: 'warning',
          },
        ],
        debtServicingCapacity: {
          assessment: icr < 1.0 ? '주의 (Caution)' : '보통 (Adequate)',
          cashAndEquivalentsNote: '보유 유동성 및 계열 지원을 통한 만기 회사채 방어 여력 점검 요망.',
          refinancingFeasibility: '공모채 차환 또는 사모 유동화 가능성 유효.',
        },
        retailInvestorGuidance: [
          '표면금리가 높아도 이자보상배율 1.0배 미만 채권은 비중을 보수적으로 제한하세요.',
          'DART 분기보고서에서 단기차입금 상환 내역을 매분기 확인하십시오.',
        ],
        generatedAt: new Date().toISOString(),
        isCustomGenerated: true,
      },
      timelineEvents: [
        {
          id: `tl-${Date.now()}-1`,
          date: new Date().toISOString().split('T')[0],
          eventType: 'FINANCIAL_REPORT',
          title: '사용자 직접 진단 채권 등록',
          summary: `신용등급 ${rating}(${outlook}), 이자보상배율 ${icr.toFixed(2)}배 정량 분석 완료.`,
          impact: icr < 1.0 ? 'negative' : 'neutral',
        },
      ],
    };

    onAddBond(newBond);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">새 채권 직접 신용 진단</h3>
              <p className="text-xs text-slate-400">
                관심 있는 회사채의 공시 원문과 재무 지표를 입력하면 AI가 정량 계산 및 리스크를 즉시 산출합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">채권 종목명</label>
              <input
                type="text"
                value={bondName}
                onChange={(e) => setBondName(e.target.value)}
                required
                placeholder="예: CJ CGV 35"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">발행사명</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                required
                placeholder="예: CJ CGV"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">업종</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">신용등급</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="AA+">AA+</option>
                <option value="AA0">AA0</option>
                <option value="AA-">AA-</option>
                <option value="A+">A+</option>
                <option value="A0">A0</option>
                <option value="A-">A-</option>
                <option value="BBB+">BBB+</option>
                <option value="BBB0">BBB0</option>
                <option value="BBB-">BBB-</option>
                <option value="BB+">BB+ (투기)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">신용전망</label>
              <select
                value={outlook}
                onChange={(e) => setOutlook(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="안정적">안정적</option>
                <option value="부정적">부정적</option>
                <option value="긍정적">긍정적</option>
                <option value="부정적 검토(Watch)">부정적 검토(Watch)</option>
              </select>
            </div>
          </div>

          {/* Quantitative Inputs */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2.5">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>정량 계산 지표 입력</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  표면금리 (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={couponRate}
                  onChange={(e) => setCouponRate(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  영업이익 (억원)
                </label>
                <input
                  type="number"
                  value={operatingProfit}
                  onChange={(e) => setOperatingProfit(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">
                  이자비용 (억원)
                </label>
                <input
                  type="number"
                  value={interestExpense}
                  onChange={(e) => setInterestExpense(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-emerald-800 font-mono">
              → 자동 계산 이자보상배율(ICR): {(operatingProfit / (interestExpense || 1)).toFixed(2)}배
            </div>
          </div>

          {/* Disclosure text */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>공시 또는 감사보고서 핵심 사실 (Raw Fact)</span>
            </label>
            <textarea
              rows={3}
              value={disclosureText}
              onChange={(e) => setDisclosureText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-xs leading-relaxed"
              placeholder="DART 공시 문구 또는 감사보고서 주석 문장을 붙여넣으세요."
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 신용 진단 실행</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
