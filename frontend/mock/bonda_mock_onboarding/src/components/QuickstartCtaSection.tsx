import React, { useState } from 'react';
import { ShieldCheck, Search, ArrowRight, Check } from 'lucide-react';
import { FREQUENT_BONDS } from '../data/bonds';

interface QuickstartCtaSectionProps {
  onStartMonitoring: (bondName: string) => void;
}

export const QuickstartCtaSection: React.FC<QuickstartCtaSectionProps> = ({
  onStartMonitoring
}) => {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = FREQUENT_BONDS.filter((b) =>
    b.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bondName = inputValue.trim() || '롯데케미칼 59-1';
    setFeedback(`'${bondName}' 데모 등록 화면을 준비했습니다.`);
    setTimeout(() => {
      onStartMonitoring(bondName);
      setFeedback(null);
    }, 1000);
  };

  const handleSelectSuggestion = (name: string) => {
    setInputValue(name);
    setShowSuggestions(false);
  };

  return (
    <section className="w-full py-20 bg-[#f8f9ff]" id="onboarding-quickstart">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="rounded-xl bg-slate-900 p-8 sm:p-12 text-white border border-slate-800 relative overflow-hidden">

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-semibold mb-6 border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>샘플 데이터 · 브라우저에서만 유지</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              관심 종목으로 리포트 흐름을<br />
              먼저 확인해 보세요.
            </h2>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl mx-auto mb-8 leading-relaxed">
              종목명을 입력하면 등록 화면과 샘플 리포트를 확인할 수 있습니다. 실제 공시 감시와 알림은 연결 예정입니다.
            </p>

            {/* Quick Interactive Input Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-lg relative mb-4">
              <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 flex-1 px-3 w-full">
                  <Search size={19} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="보유한 회사채 이름 입력 (예: 대한항공)"
                    className="w-full py-2 bg-transparent text-[#0b1c30] text-sm focus:outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all whitespace-nowrap active:scale-[0.98]"
                >
                  데모 등록 계속하기
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 text-left z-30 overflow-hidden text-slate-800">
                  <div className="p-2 text-[11px] font-bold text-slate-400 bg-slate-50 border-b border-slate-100">
                    인기 회사채 추천
                  </div>
                  {filteredSuggestions.map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => handleSelectSuggestion(b.name)}
                      className="w-full px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between text-xs text-slate-700 font-medium border-b border-slate-50 last:border-0"
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {b.rating}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Feedback banner */}
            {feedback && (
              <div className="text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg mb-4 animate-fade-in border border-white/30">
                {feedback}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/80 text-xs font-medium">
              <span className="flex items-center gap-1">
                <Check size={14} className="text-emerald-300" />
                실제 계정 생성 없음
              </span>
              <span className="flex items-center gap-1">
                <Check size={14} className="text-emerald-300" />
                AI 리포트 샘플 제공
              </span>
              <span className="flex items-center gap-1">
                <Check size={14} className="text-emerald-300" />
                알림 화면 미리보기
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
