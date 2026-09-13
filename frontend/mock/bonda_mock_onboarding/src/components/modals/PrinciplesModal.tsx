import React from 'react';
import { X, Layers, FileText, Calculator, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PrinciplesModalProps {
  onClose: () => void;
}

export const PrinciplesModal: React.FC<PrinciplesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0b1c30] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Bonda 3대 투명성 원칙</h3>
              <p className="text-xs text-slate-300">금융 인텔리전스에서 환각(Hallucination)을 원천 차단하는 설계</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* Intro Warning */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-amber-900 leading-relaxed">
              <strong>회사채 투자는 원금 보장이 생명입니다.</strong> 일반 범용 LLM에게 "이 회사채 안전해?"라고 물으면 존재하지 않는 공시나 왜곡된 재무 수치를 그럴듯하게 꾸며내는 치명적 환각이 발생합니다. Bonda는 이를 해결하기 위해 3계층 물리적 격리 원칙을 준수합니다.
            </p>
          </div>

          {/* Principle 1 */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-700">1</div>
              <FileText size={16} />
              <span>원문 사실 (Fact Grounding) 100% 인용</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              DART 전자공시시스템 및 3대 신용평가사(한기평, 나신평, 한신평)의 실제 발행 보고서 원문만을 발췌합니다. AI가 문맥을 가공하지 않고 원본 발췌문과 공시 접수번호를 그대로 노출하여 검증 가능성을 제공합니다.
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-mono">
              ✓ 검증 기준: SHA-256 금융감독원 공시 원본 해시 일치 검증
            </div>
          </div>

          {/* Principle 2 */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
              <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs">2</div>
              <Calculator size={16} />
              <span>결정론적 정량 공식 (Deterministic Calculation)</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              이자보상배율, 부채비율, 순차입금/EBITDA 등 모든 수치 계산은 AI 언어모델의 추론에 맡기지 않고, 파이썬 수학 검증 엔진에서 정확한 수학 공식에 의해 계산됩니다. 오차 0.00%를 보장합니다.
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-500 font-mono">
              ✓ 수식 투명성: EBIT ÷ 총이자비용 산출 근거 100% 개방
            </div>
          </div>

          {/* Principle 3 */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-sm">
              <div className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">3</div>
              <Sparkles size={16} />
              <span>시각적으로 격리된 AI 시나리오 해석 (Segregated Reasoning)</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              AI의 정성적 시나리오 분석(부도 확률 추정, 유동성 지원 여력, 만기 보유 전략)은 명확한 보라색 AI 블록에 격리되어 사실과 의견이 혼동되지 않도록 철저히 디자인되었습니다.
            </p>
            <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-100 text-[11px] text-purple-800">
              ✓ 안전장치: 투자자문 규정 준수 및 법적 고지 명시
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            원칙 확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
