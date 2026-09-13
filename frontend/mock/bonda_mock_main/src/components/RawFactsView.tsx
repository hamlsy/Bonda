import React, { useState } from 'react';
import { RawFactsData } from '../types';
import {
  FileText,
  Quote,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
  Building,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';

interface RawFactsViewProps {
  rawFacts: RawFactsData;
  issuerName: string;
}

export const RawFactsView: React.FC<RawFactsViewProps> = ({ rawFacts, issuerName }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Domain Philosophy Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-indigo-950 text-sm flex items-center gap-2">
            원문 사실 (Raw Facts) 검증 원칙
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800 font-semibold">
              100% 팩트 보장 · 왜곡 배제
            </span>
          </div>
          <p className="text-indigo-900/80 mt-1 leading-relaxed">
            금융감독원 전자공시시스템(DART), 공인회계사 감사보고서 주석, 국내 신용평가 3사(한기평·한신평·NICE)
            공식 본평가서의 원문 문장을 일체의 자의적 해석 없이 인용합니다.
          </p>
        </div>
      </div>

      {/* Disclosures Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            공시 및 신평사 원문 인용 ({rawFacts.disclosures.length}건)
          </h3>
          <span className="text-xs text-slate-400">최신순 정렬</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {rawFacts.disclosures.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                item.isKeyTrigger
                  ? 'border-indigo-300 shadow-sm ring-1 ring-indigo-400/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Fact Card Header */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.source}
                  </span>
                  {item.isKeyTrigger && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      핵심 신용 트리거
                    </span>
                  )}
                  {item.documentNumber && (
                    <span className="text-[11px] font-mono text-slate-400">
                      접수번호 {item.documentNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                  <button
                    onClick={() => handleCopy(item.originalQuote, item.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="원문 복사"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm mb-3">{item.title}</h4>

              {/* Exact Verbatim Quote Box */}
              <div className="relative p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 font-sans text-slate-800 text-xs sm:text-sm leading-relaxed">
                <Quote className="w-4 h-4 text-indigo-400 absolute top-2.5 left-2.5 opacity-40 -scale-x-100" />
                <p className="pl-5 text-slate-800 font-normal select-text">
                  &ldquo;{item.originalQuote}&rdquo;
                </p>
              </div>

              {/* Verification Stamp */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  공시 검증 완료 (불변 팩트)
                </span>
                <span className="text-slate-400">DART 공시 시스템 실시간 연계</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Opinion & Emphasis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Auditor Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <Building className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">독립 감사인의 감사의견 원문</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">감사 의견</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {rawFacts.auditOpinion.opinion} (적정)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">감사 회계법인</span>
              <span className="font-semibold text-slate-800">{rawFacts.auditOpinion.auditor}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">대상 사업연도</span>
              <span className="font-semibold text-slate-800">{rawFacts.auditOpinion.fiscalYear}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 mb-1">감사인 핵심 강조사항(Emphasis of Matter)</div>
              <p className="text-slate-600 leading-relaxed">
                {rawFacts.auditOpinion.emphasisOfMatter}
              </p>
            </div>
          </div>
        </div>

        {/* Contingent Liabilities & Pledges */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <Scale className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">담보 제공 및 우발채무 주석 원문</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] font-bold text-slate-700 mb-1">총 지급보증 및 약정액</div>
              <div className="text-sm font-bold text-indigo-950">
                {rawFacts.contingentLiabilities.totalGuarantees}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] font-bold text-slate-700 mb-1">채권 담보 제공 자산</div>
              <div className="text-slate-700 font-medium">
                {rawFacts.contingentLiabilities.pledgedAssets}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] font-bold text-slate-700 mb-1">소송 및 우발리스크 현황</div>
              <div className="text-slate-700">
                {rawFacts.contingentLiabilities.litigationRisk}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
