import React from 'react';
import { Zap, Check, X } from 'lucide-react';
import { COMPARISON_TABLE_DATA } from '../data/bonds';

export const ComparisonSection: React.FC = () => {
  return (
    <section className="w-full py-20 bg-slate-100/60 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0b1c30] tracking-tight mb-3">
            기존의 답답했던 채권 관리 vs Bonda
          </h2>
          <p className="text-base text-[#464555] leading-relaxed">
            정보 비대칭의 불리함에서 벗어나, 이제 기관 수준의 데이터 감시 체계를 개인 손안에 두세요.
          </p>
        </div>

        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 shadow-md shadow-slate-200/50 bg-white">
          <div className="min-w-[700px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-100/90 py-4 px-6 text-sm font-bold text-[#0b1c30] border-b border-slate-200">
              <div className="col-span-3">비교 기준</div>
              <div className="col-span-4 text-slate-500 font-semibold">기존 개인투자자 방식</div>
              <div className="col-span-5 text-indigo-600 flex items-center gap-1.5 font-bold">
                <Zap size={16} className="fill-indigo-600" />
                <span>Bonda AI 방식</span>
              </div>
            </div>

            {/* Table Rows */}
            {COMPARISON_TABLE_DATA.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 py-4 px-6 items-center text-xs sm:text-sm border-b border-slate-100 hover:bg-indigo-50/30 transition-colors"
              >
                <div className="col-span-3 font-semibold text-[#0b1c30]">
                  {row.criterion}
                </div>
                <div className="col-span-4 text-slate-500 pr-4 leading-relaxed">
                  {row.legacy}
                </div>
                <div className="col-span-5 text-slate-900 font-medium flex items-center gap-2 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <Check size={14} className="stroke-[2.5]" />
                  </div>
                  <span>{row.bonda}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
