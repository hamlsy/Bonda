import React, { useState } from 'react';
import { Search, Check, Smartphone, BellRing, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenRegister: () => void;
  onOpenKakaoSample: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onOpenRegister,
  onOpenKakaoSample
}) => {
  const [trigger1, setTrigger1] = useState(true);
  const [trigger2, setTrigger2] = useState(true);
  const [sampleInput, setSampleInput] = useState('');

  return (
    <section className="w-full py-20 bg-[#f8f9ff]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-700 tracking-wider uppercase">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0b1c30] tracking-tight mt-2 mb-3">
            단 3단계로 끝나는 안심 채권 모니터링
          </h2>
          <p className="text-base text-[#464555] leading-relaxed">
            복잡한 서류나 공인인증서 등록 없이, 채권 이름만 치면 즉각적인 인텔리전스가 시작됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-start p-7 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-sm shadow-indigo-200">
              1
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] mb-2">
              내 회사채 또는 관심 기업 입력
            </h3>
            <p className="text-sm text-[#464555] leading-relaxed mb-6">
              키움, 삼성, 토스증권 등에서 매수한 회사채 종목명을 검색창에 넣거나 관심 그룹으로 추가하세요.
            </p>
            <div
              onClick={onOpenRegister}
              className="w-full mt-auto p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-inner flex items-center gap-2.5 cursor-pointer hover:border-indigo-300 transition-colors group"
            >
              <Search size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="text-xs text-slate-500 group-hover:text-slate-800">
                예: 대한항공 101, 한화솔루션...
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-start p-7 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-sm shadow-purple-200">
              2
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] mb-2">
              나만의 위험 감지 조건 선택
            </h3>
            <p className="text-sm text-[#464555] leading-relaxed mb-6">
              신용등급 전망 하향(Negative 전환), 이자보상배율 1배 미만 추락, DART 횡령·배임 공시 등 원하는 트리거를 켭니다.
            </p>
            <div className="w-full mt-auto space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <button
                type="button"
                onClick={() => setTrigger1(!trigger1)}
                className="w-full flex items-center justify-between text-xs text-left"
              >
                <span className="text-slate-700 font-medium">신평사 아웃룩 변동 알림</span>
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] transition-colors ${
                    trigger1 ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  ✓
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTrigger2(!trigger2)}
                className="w-full flex items-center justify-between text-xs text-left"
              >
                <span className="text-slate-700 font-medium">부채비율 20% 이상 급증</span>
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] transition-colors ${
                    trigger2 ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  ✓
                </span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-start p-7 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-200 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-sm shadow-teal-200">
              3
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] mb-2">
              카톡 & 이메일로 24시간 안심 리포트
            </h3>
            <p className="text-sm text-[#464555] leading-relaxed mb-6">
              평상시엔 주간 안심 다이제스트를, 비상 징후 발견 시 실시간 긴급 분석 브리핑을 모바일로 보내드립니다.
            </p>
            <div
              onClick={onOpenKakaoSample}
              className="w-full mt-auto p-3 rounded-xl bg-[#FFE812]/20 border border-[#FFE812]/70 flex items-center gap-2.5 cursor-pointer hover:bg-[#FFE812]/30 transition-all shadow-xs"
              title="클릭하여 실제 카카오톡 알림 예시 보기"
            >
              <div className="w-7 h-7 rounded-full bg-[#3C1E1E] text-[#FFE812] flex items-center justify-center font-bold text-xs shrink-0">
                톡
              </div>
              <span className="text-xs text-slate-900 font-semibold truncate">
                롯데케미칼 긴급 알림톡이 도착했습니다
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/50 text-slate-800 font-bold ml-auto shrink-0">
                예시
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
