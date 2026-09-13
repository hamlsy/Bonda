import React from 'react';
import { X, Send, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BondItem } from '../../types';

interface KakaoModalProps {
  bond: BondItem | null;
  onClose: () => void;
  onConfirmSetup: () => void;
}

export const KakaoModal: React.FC<KakaoModalProps> = ({
  bond,
  onClose,
  onConfirmSetup
}) => {
  if (!bond) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#fee500] text-[#3c1e1e] px-5 py-3.5 flex items-center justify-between border-b border-yellow-300">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3c1e1e] text-[#fee500] flex items-center justify-center font-bold text-xs">
              톡
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">카카오 알림톡 실시간 미리보기</h3>
              <p className="text-[11px] text-[#3c1e1e]/80">Bonda 안심 채권 리포트 채널</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#3c1e1e]/70 hover:text-[#3c1e1e] p-1 rounded-lg hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Kakao Bubble Area */}
        <div className="bg-[#b2c7da] p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="text-center">
            <span className="text-[10px] bg-black/10 text-white/90 px-2.5 py-0.5 rounded-full">
              오늘 오전 08:30 긴급 브리핑
            </span>
          </div>

          {/* Realistic Alimtalk Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs text-slate-800 space-y-3">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-indigo-700 text-sm flex items-center gap-1">
                <span>[Bonda AI]</span> 신용위험 긴급 알림
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                주의 징후
              </span>
            </div>

            <div>
              <p className="font-bold text-slate-900 text-sm mb-1">{bond.name}</p>
              <p className="text-slate-500 text-[11px]">{bond.coupon} · {bond.maturity}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 border border-slate-100 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">현재 신용등급:</span>
                <span className="font-bold text-slate-900">{bond.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">신용위험 변동치:</span>
                <span className="font-bold text-rose-600">{bond.riskDelta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">이자보상배율:</span>
                <span className="font-bold text-slate-800">{bond.formula.interestCover}</span>
              </div>
            </div>

            <div className="text-slate-700 leading-relaxed text-[11px] border-l-2 border-indigo-500 pl-2">
              <p className="font-bold text-indigo-900 mb-0.5">📌 AI 1장 핵심 요약</p>
              <p>{bond.insight.summary.replace(/"/g, '')}</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs text-center block transition-colors"
              >
                Bonda 3대 투명성 상세 리포트 열람 &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
          <p className="text-[11px] text-slate-500 text-center">
            실제 서비스에서는 매수 채권의 중요한 재무 및 등급 변경 시 위와 같이 카카오톡으로 발송됩니다.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onConfirmSetup}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              이 채권 알림 받기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
