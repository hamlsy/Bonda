import React from 'react';
import { X, FileText, Calculator, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FrameworkLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkLegendModal: React.FC<FrameworkLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                BondCredit AI 3대 신용 분석 프레임워크
              </h3>
              <p className="text-xs text-slate-400">
                개인투자자가 안심하고 채권에 투자할 수 있도록 팩트, 계산, AI 영역을 엄격히 분리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-indigo-950 text-sm">
                1. 원문 사실 (Raw Facts) — 불변의 객관적 증거
              </h4>
            </div>
            <p className="text-slate-700 leading-relaxed pl-8">
              금융감독원 전자공시시스템(DART), 감사보고서 주석, 국내 3대 신용평가사(한기평, 한신평, NICE)의
              공식 보고서 원문을 100% 그대로 발췌합니다. AI의 가공이나 왜곡 없이 법적 효력을 갖는 원문 공시 내용을
              직접 확인할 수 있습니다.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <Calculator className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-emerald-950 text-sm">
                2. 정량 계산 지표 (Deterministic Metrics) — 수학적 확정치
              </h4>
            </div>
            <p className="text-slate-700 leading-relaxed pl-8">
              이자보상배율(ICR), 부채비율, 순차입금/EBITDA, 유동비율, 단기차입금 비중, 크레딧 스프레드 등
              오차 없는 회계 수식을 통해 명확히 계산된 확정값입니다. 각 지표별 분자/분모 산출식과 임계 기준치를
              투명하게 공개합니다.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-violet-950 text-sm">
                3. AI 분석 리포트 (LLM Insights) — 교차 검증 및 투자자 가이드
              </h4>
            </div>
            <p className="text-slate-700 leading-relaxed pl-8">
              Gemini AI가 원문 공시 사실과 정량 수치를 상호 대조하여 기한이익상실(EOD) 위험, 리파이낸싱 스트레스,
              우발채무 전이 가능성을 입체적으로 진단하고, 개인투자자가 실제 만기까지 보유해도 안전한지 여부와
              실전 대응 지침을 제공합니다.
            </p>
          </div>

          {/* Timeline & Signals */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              신용위험 변화 신호 (Risk Signals) &amp; 타임라인
            </h4>
            <p className="text-slate-600 leading-relaxed">
              신용평가사 아웃룩 변경(안정적 → 부정적), 사채관리계약 재무비율 특약 위반, 대규모 유상증자 등
              채권 가격과 상환 가능성에 중대한 영향을 미치는 이벤트를 시각화하여 사전에 위험을 감지할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
