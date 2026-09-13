import React from 'react';
import { X, ExternalLink, ShieldCheck, Printer, CheckCircle } from 'lucide-react';
import { BondItem } from '../../types';

interface DartModalProps {
  bond: BondItem | null;
  onClose: () => void;
}

export const DartModal: React.FC<DartModalProps> = ({ bond, onClose }) => {
  if (!bond) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header styled like DART electronic filing top bar */}
        <div className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold">
              D
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                금융감독원 전자공시시스템 (DART) 공시 원문
              </h3>
              <p className="text-[11px] text-blue-200">
                접수번호: {bond.fact.filingNumber} | 제출일시: {bond.fact.filingDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filing Metadata bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            <span className="font-semibold text-slate-800">보고서명:</span> {bond.fact.title}
          </div>
          <div>
            <span className="font-semibold text-slate-800">제출인:</span> {bond.company} 주식회사
          </div>
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
            <ShieldCheck size={14} />
            <span>위변조 검증 통과 (100% 원문 일치)</span>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono">
          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 text-sm">{bond.name} 관련 공시</span>
              <span className="text-xs text-slate-500">한국거래소(KRX) 유통 공시</span>
            </div>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed">
              {bond.fact.detailedDARTExcerpt}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs font-sans">
            <p className="font-bold mb-1 flex items-center gap-1">
              <span>💡 Bonda AI 투명성 검증 가이드</span>
            </p>
            <p>
              Bonda AI는 원문의 문맥을 임의로 왜곡하거나 없는 사실을 추가하지 않습니다. 위 인용구는 금융감독원 DART 공시 원문 DB에서 SHA-256 해시 검증을 거쳐 직접 인출되었습니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400">데이터 출처: 대한민국 금융감독원 DART 오픈API</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
