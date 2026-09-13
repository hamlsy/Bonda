import React, { useState } from 'react';
import { X, Search, Bell, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { FREQUENT_BONDS } from '../../data/bonds';

interface RegisterBondModalProps {
  initialBondName?: string;
  onClose: () => void;
  onSubmit: (data: {
    bondName: string;
    buyDate: string;
    notifyOutlookChange: boolean;
    notifyDebtSurge: boolean;
    notifyDartDisclosure: boolean;
    contactChannel: 'kakao' | 'email' | 'both';
    contactValue: string;
  }) => void;
}

export const RegisterBondModal: React.FC<RegisterBondModalProps> = ({
  initialBondName = '',
  onClose,
  onSubmit
}) => {
  const [bondName, setBondName] = useState(initialBondName || '롯데케미칼 59-1');
  const [buyDate, setBuyDate] = useState('2023-11-14');
  const [notifyOutlookChange, setNotifyOutlookChange] = useState(true);
  const [notifyDebtSurge, setNotifyDebtSurge] = useState(true);
  const [notifyDartDisclosure, setNotifyDartDisclosure] = useState(true);
  const [contactChannel, setContactChannel] = useState<'kakao' | 'email' | 'both'>('kakao');
  const [contactValue, setContactValue] = useState('010-1234-5678');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      bondName,
      buyDate,
      notifyOutlookChange,
      notifyDebtSurge,
      notifyDartDisclosure,
      contactChannel,
      contactValue
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">내 회사채 안심 모니터링 등록</h3>
              <p className="text-xs text-indigo-100">3초 만에 DART 공시 및 신평사 연동 시작</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Bond Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              보유 회사채 종목명 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={bondName}
                onChange={(e) => setBondName(e.target.value)}
                placeholder="예: 대한항공 101, 롯데케미칼 59-1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
              />
            </div>
            {/* Quick recommendation chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">추천:</span>
              {FREQUENT_BONDS.slice(0, 4).map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBondName(b.name)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Buy Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              매수 일자 (또는 기준일자)
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              매수 시점의 재무 상태와 현재 재무 상태를 비교하여 위험 델타(Delta)를 측정합니다.
            </p>
          </div>

          {/* Alert Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              자동 위험 감지 트리거 설정
            </label>
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-700">3대 신평사 등급 아웃룩 변동 (Negative 전환)</span>
                <input
                  type="checkbox"
                  checked={notifyOutlookChange}
                  onChange={(e) => setNotifyOutlookChange(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-700">부채비율 20% 이상 급증 / 이자보상배율 1배 미만</span>
                <input
                  type="checkbox"
                  checked={notifyDebtSurge}
                  onChange={(e) => setNotifyDebtSurge(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-700">DART 수시공시 (횡령·배임, 인수합병, 차입금 증가)</span>
                <input
                  type="checkbox"
                  checked={notifyDartDisclosure}
                  onChange={(e) => setNotifyDartDisclosure(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Notification channel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              알림 수신 채널 및 연락처
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setContactChannel('kakao')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  contactChannel === 'kakao'
                    ? 'bg-[#fee500] border-yellow-400 text-[#3c1e1e]'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                카카오 알림톡
              </button>
              <button
                type="button"
                onClick={() => setContactChannel('email')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  contactChannel === 'email'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                이메일
              </button>
              <button
                type="button"
                onClick={() => setContactChannel('both')}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  contactChannel === 'both'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                카톡 + 이메일
              </button>
            </div>
            <input
              type="text"
              required
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={contactChannel === 'email' ? 'user@example.com' : '010-0000-0000'}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              무료로 24시간 감시 시작하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
