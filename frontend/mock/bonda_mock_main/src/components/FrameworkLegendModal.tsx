import React from 'react';
import { X, FileText, Calculator, Sparkles, ShieldCheck } from 'lucide-react';
import { DialogShell } from './DialogShell';

interface FrameworkLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkLegendModal: React.FC<FrameworkLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <DialogShell isOpen={isOpen} onClose={onClose} labelledBy="framework-title" describedBy="framework-description" className="max-w-2xl">
      <div className="bg-white rounded-xl w-full p-5 sm:p-7 border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="framework-title" className="font-extrabold text-slate-900 text-lg">
                Bonda 분석 근거 안내
              </h3>
              <p id="framework-description" className="text-xs text-slate-500">
                개인투자자가 안심하고 채권에 투자할 수 있도록 팩트, 계산, AI 영역을 엄격히 분리합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="분석 근거 안내 닫기"
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
              공식 보고서 원문을 출처와 함께 구분해 보여주는 영역입니다. 현재 화면의 내용은 UI 검증용 데모 데이터이며,
              실제 원문 연동 전에는 투자 판단 근거로 사용할 수 없습니다.
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
              정해진 회계 수식으로 계산한 값입니다. 각 지표의 분자·분모, 기준일, 임계값을 함께 공개하는 것을 원칙으로 합니다.
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
              원문 사실과 정량 수치를 바탕으로 위험 요인을 요약하는 참고 영역입니다. 추론 결과는 사실과 분리하고,
              근거 링크와 생성 시각을 함께 제공하도록 설계합니다. 현재 결과는 샘플입니다.
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
    </DialogShell>
  );
};
