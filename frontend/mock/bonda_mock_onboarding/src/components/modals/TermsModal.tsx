import React from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="bg-[#0b1c30] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold">서비스 이용약관 및 투자유의사항</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertCircle size={15} className="text-amber-700" />
              <span>법적 고지 및 투자 유의사항</span>
            </p>
            <p>
              Bonda AI가 제공하는 재무 지표, 정량 분석, 신용등급 변동 예측 및 인공지능 요약 정보는 단순 투자 참고용 정보이며, 자본시장과 금융투자업에 관한 법률상 개별 투자 권유 또는 자문 서비스가 아닙니다.
            </p>
            <p>
              회사채 투자는 발행 기업의 재무 악화 또는 부도 시 원금 전액 손실 위험이 수반될 수 있으며, 모든 투자의 최종 결정과 손익의 귀속은 투자자 본인에게 있습니다.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">제1조 (개인정보의 처리 및 목적)</h4>
            <p className="text-xs text-slate-500">
              당사는 이용자가 등록한 모니터링 대상 회사채 정보 및 알림 수신용 연락처(카카오톡 번호, 이메일)를 신용 모니터링 알림 발송 목적 이외의 용도로 제3자에게 제공하거나 판매하지 않습니다.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-1">제2조 (공시 데이터의 신뢰성)</h4>
            <p className="text-xs text-slate-500">
              당사는 대한민국 금융감독원 전자공시시스템(DART) 및 한국기업평가, NICE신용평가, 한국신용평가의 공개 데이터를 바탕으로 원문을 발췌하고 수식을 산출합니다.
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
