import React, { useState } from 'react';
import { RiskSignal, TimelineEvent } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface RiskSignalsTimelineViewProps {
  signals: RiskSignal[];
  timeline: TimelineEvent[];
  bondName: string;
}

export const RiskSignalsTimelineView: React.FC<RiskSignalsTimelineViewProps> = ({
  signals,
  timeline,
  bondName,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const getImpactStyle = (impact: 'negative' | 'neutral' | 'positive') => {
    switch (impact) {
      case 'negative':
        return {
          dot: 'bg-rose-500 ring-rose-200',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          border: 'border-rose-200',
          label: '위험 요인',
        };
      case 'positive':
        return {
          dot: 'bg-emerald-500 ring-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          border: 'border-emerald-200',
          label: '신용 개선',
        };
      case 'neutral':
      default:
        return {
          dot: 'bg-blue-500 ring-blue-200',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          border: 'border-slate-200',
          label: '주요 공시',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Active Risk Signals Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              현재 감지된 신용위험 변화 신호 (Risk Signals)
            </h3>
          </div>
          <span className="text-xs text-slate-400">총 {signals.length}건 감지</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((sig) => {
            const isAlert = sig.type === 'alert';
            const isWatch = sig.type === 'watch';

            return (
              <div
                key={sig.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isAlert
                    ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                    : isWatch
                    ? 'bg-amber-50/50 border-amber-200 shadow-xs'
                    : 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      isAlert
                        ? 'bg-rose-100 text-rose-800'
                        : isWatch
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isAlert && <AlertTriangle className="w-3 h-3" />}
                    {isWatch && <Clock className="w-3 h-3" />}
                    {!isAlert && !isWatch && <CheckCircle2 className="w-3 h-3" />}
                    {isAlert ? '위험 경보' : isWatch ? '관찰 요망' : '긍정적 요인'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{sig.date}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{sig.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{sig.description}</p>

                {sig.metricTrigger && (
                  <div className="p-2 rounded-lg bg-white/80 border border-slate-200/80 text-[11px] text-slate-700 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">트리거 지표:</span>
                    <span className="font-mono text-indigo-700 font-bold">{sig.metricTrigger}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Chronological Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              신용 이벤트 타임라인 (Credit Event Timeline)
            </h3>
          </div>
          <span className="text-xs text-slate-400">시간순 신용 변화 궤적</span>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
          {timeline.map((event, idx) => {
            const style = getImpactStyle(event.impact);
            const isExpanded = selectedEvent?.id === event.id;

            return (
              <div key={event.id} className="relative group">
                {/* Timeline Dot Marker */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full ring-4 bg-white ${style.dot} transition-transform group-hover:scale-125`}
                />

                {/* Event Card */}
                <div
                  onClick={() => setSelectedEvent(isExpanded ? null : event)}
                  className={`p-4 sm:p-5 rounded-2xl bg-white border cursor-pointer transition-all ${
                    isExpanded
                      ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {event.date}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {event.eventType}
                      </span>
                    </div>

                    {event.metricChange && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {event.metricChange}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{event.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{event.summary}</p>

                  {/* Related Quote if available or clicked */}
                  {event.relatedFactQuote && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                      &ldquo;{event.relatedFactQuote}&rdquo;
                    </div>
                  )}

                  <div className="mt-2 text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                    <span>{isExpanded ? '상세 접기' : '클릭하여 관련 팩트 확인'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
