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
    setFeedback(`🎉 [성공] '${bondName}'이(가) 온보딩 관심종목으로 등록되었습니다!`);
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
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 sm:p-12 text-white shadow-xl shadow-indigo-950/15 relative overflow-hidden">
          {/* Decorative Ambient Rings */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-semibold mb-6 border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>신용카드 등록 없음 · 3초 간편 시작</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              회사채 투자, 이제 불안해하며<br />
              만기를 기다리지 마세요.
            </h2>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl mx-auto mb-8 leading-relaxed">
              지금 보유 중인 채권 1개만 등록해도, 오늘 밤 DART에 올라온 최신 보고서까지 AI가 즉시 정밀 분석해 드립니다.
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
                  지금 무료 모니터링 시작
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
                무료 계정으로 최대 3개 채권 동시 모니터링
              </span>
              <span className="flex items-center gap-1">
                <Check size={14} className="text-emerald-300" />
                주간 정기 AI 크레딧 리포트
              </span>
              <span className="flex items-center gap-1">
                <Check size={14} className="text-emerald-300" />
                긴급 위험 감지 카톡 전송
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
