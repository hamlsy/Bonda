import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRiskEvent } from "./api";
import { AppHeader, MobileNav } from "./Navigation";
import type { RiskEventDetail } from "./types";

type PageState = "loading" | "ready" | "error";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  BORROWING_INCREASE: "차입 증가",
  COLLATERAL_PLEDGE: "담보 제공",
  CREDIT_RATING_CHANGE: "신용등급 변경",
  DEBT_GUARANTEE: "채무보증",
  LIQUIDITY_WARNING: "유동성 확인 필요",
  OPERATING_DOWNTURN: "영업실적 변화",
};

function eventTypeLabel(eventType: string) {
  return EVENT_TYPE_LABELS[eventType] ?? "기타 신용 변화";
}

export default function RiskEventPage() {
  const { riskEventId } = useParams();
  const numericId = Number(riskEventId);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [detail, setDetail] = useState<RiskEventDetail | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    document.title = "검증된 원문 | Bonda";
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setPageState("error");
      return;
    }
    const controller = new AbortController();
    setPageState("loading");
    getRiskEvent(numericId, controller.signal)
      .then((value) => {
        setDetail(value);
        setPageState("ready");
        document.title = `${value.disclosureTitle} | Bonda`;
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPageState("error");
      });
    return () => controller.abort();
  }, [numericId, retryKey]);

  return (
    <div className="app-shell evidence-page-shell">
      <AppHeader backLabel="내 채권으로" />
      <main>
        {pageState === "loading" && (
          <section className="state-panel" aria-live="polite" aria-busy="true">
            <span className="spinner" aria-hidden="true" /><p>검증된 원문을 불러오고 있습니다.</p>
          </section>
        )}
        {pageState === "error" && (
          <section className="state-panel error-panel" role="alert">
            <div><h1 className="state-title">원문 근거를 불러오지 못했습니다</h1><p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p></div>
            <button type="button" className="secondary-button" onClick={() => setRetryKey((value) => value + 1)}>다시 불러오기</button>
          </section>
        )}
        {pageState === "ready" && detail && (
          <article className="evidence-page">
            <p className="eyebrow">EVIDENCE FIRST</p>
            <h1>{detail.disclosureTitle}</h1>
            <p className="evidence-page-meta">{formatDateTime(detail.publishedAt)} · 접수번호 {detail.sourceReceiptNo}</p>
            <div className="source-rule"><span>검증된 변화 유형</span><strong>{eventTypeLabel(detail.eventType)}</strong></div>
            {detail.evidence.length === 0 ? (
              <div className="quiet-empty"><p>연결된 근거 구간이 없습니다.</p></div>
            ) : (
              <ol className="evidence-page-list">
                {detail.evidence.map((evidence) => (
                  <li key={evidence.id}>
                    {evidence.section && <p>{evidence.section}</p>}
                    <blockquote>{evidence.evidenceText}</blockquote>
                    {evidence.sourceUrl && <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">원문에서 확인하기 ↗</a>}
                  </li>
                ))}
              </ol>
            )}
            <p className="source-note">이 화면은 검증 과정에서 원문과 일치한 구간만 보여줍니다.</p>
          </article>
        )}
      </main>
      <MobileNav />
      <footer><p>Bonda monitors change. Decisions remain yours.</p></footer>
    </div>
  );
}
