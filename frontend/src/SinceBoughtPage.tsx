import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRiskEvent, getSinceBought } from "./api";
import { AppHeader, MobileNav } from "./Navigation";
import type {
  FinancialChange,
  RiskEventDetail,
  RiskState,
  SinceBoughtResponse,
  SinceBoughtTimelineItem,
} from "./types";

type PageState = "loading" | "ready" | "error";
type EvidenceState = { status: "loading" | "ready" | "error"; detail?: RiskEventDetail };

const riskLabels = {
  liquidity: "유동성",
  cashFlow: "현금흐름",
  leverage: "부채 부담",
  earnings: "수익성",
  credit: "신용",
} as const;

const stateLabels: Record<RiskState, string> = {
  NORMAL: "정상",
  WATCH: "관찰",
  CAUTION: "주의",
};

function overallState(state: SinceBoughtResponse["currentRiskState"]) {
  if (!state) return null;
  const values = [state.liquidity, state.cashFlow, state.leverage, state.earnings, state.credit];
  if (values.includes("CAUTION")) return "CAUTION";
  if (values.includes("WATCH")) return "WATCH";
  return "NORMAL";
}

const timelineLabels: Record<SinceBoughtTimelineItem["type"], string> = {
  PURCHASE: "매수",
  RISK_EVENT: "공시 변화",
  RISK_CHANGE: "상태 변화",
  FINANCIAL_CHANGE: "재무 변화",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "비율 산정 불가";
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(Math.abs(value) * 100)}%`;
}

function formatPeriod(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return /^\d{4}$/.test(value) ? `${value}년` : value;
}

function EvidenceDisclosure({ riskEventId }: { riskEventId: number }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<EvidenceState | null>(null);

  async function fetchEvidence() {
    setState({ status: "loading" });
    try {
      const detail = await getRiskEvent(riskEventId);
      setState({ status: "ready", detail });
    } catch {
      setState({ status: "error" });
    }
  }

  function toggleEvidence() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (state?.status !== "ready") void fetchEvidence();
  }

  return (
    <div className="evidence-disclosure">
      <button
        type="button"
        className="evidence-toggle"
        onClick={toggleEvidence}
        aria-expanded={open}
      >
        {open ? "원문 접기" : "원문에서 확인"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="evidence-panel" aria-live="polite">
          {state?.status === "loading" && <p>검증된 원문을 불러오고 있어요.</p>}
          {state?.status === "error" && (
            <div className="inline-error" role="alert">
              <p>공시 원문을 불러오지 못했습니다.</p>
              <button type="button" onClick={() => void fetchEvidence()}>다시 시도</button>
            </div>
          )}
          {state?.status === "ready" && state.detail && (
            <>
              <div className="evidence-source">
                <span>공시 원문</span>
                <strong>{state.detail.disclosureTitle}</strong>
                <small>{formatDateTime(state.detail.publishedAt)} · 접수번호 {state.detail.sourceReceiptNo}</small>
              </div>
              {state.detail.evidence.length === 0 ? (
                <p>연결된 원문 구간이 없습니다.</p>
              ) : (
                <ul>
                  {state.detail.evidence.map((evidence) => (
                    <li key={evidence.id}>
                      {evidence.section && <span>{evidence.section}</span>}
                      <blockquote>{evidence.evidenceText}</blockquote>
                      {evidence.sourceUrl && (
                        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">DART 원문 열기 ↗</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Timeline({ items, featuredRiskEventId, explainDebt }: { items: SinceBoughtTimelineItem[]; featuredRiskEventId: number | null; explainDebt: boolean }) {
  const datedItems = items.filter((item) => item.date);
  const changeCount = datedItems.filter((item) => item.type !== "PURCHASE").length;
  const firstDebtIndex = explainDebt ? datedItems.findIndex((item) => item.title.includes("총차입금")) : -1;
  return (
    <>
      <ol className="risk-timeline" aria-label={`매수 이후 ${changeCount}개의 변화`}>
        {datedItems.map((item, index) => (
          <li key={`${item.type}-${item.date}-${item.riskEventId ?? item.riskChangeId ?? index}`} className={`timeline-${item.type.toLowerCase()}`}>
            <div className="timeline-marker" aria-hidden="true" />
            <article>
              <div className="timeline-meta">
                <time dateTime={item.date}>{formatDate(item.date)}</time>
                <span>{timelineLabels[item.type]}</span>
                {item.severity && <span className={`state-tag state-${item.severity.toLowerCase()}`}>{stateLabels[item.severity]}</span>}
              </div>
              <h3>{index === firstDebtIndex ? `${item.title} (빌린 돈)` : item.title}</h3>
              <p>{item.summary}</p>
              {item.riskEventId !== featuredRiskEventId && item.riskEventId && item.evidenceAvailable && <EvidenceDisclosure riskEventId={item.riskEventId} />}
              {item.riskEventId !== featuredRiskEventId && item.riskEventId && !item.evidenceAvailable && <p className="evidence-unavailable">연결된 공시 원문이 없습니다.</p>}
            </article>
          </li>
        ))}
      </ol>
      {changeCount === 0 && (
        <div className="timeline-empty">
          <span aria-hidden="true">✓</span>
          <div>
            <h3>새롭게 확인된 주요 변화가 아직 없어요.</h3>
            <p>매수일 이후 검증된 공시와 위험 상태 변화를 계속 확인합니다.</p>
          </div>
        </div>
      )}
    </>
  );
}

function FinancialChangeList({ changes, data, explainDebt }: { changes: FinancialChange[]; data: SinceBoughtResponse; explainDebt: boolean }) {
  if (changes.length === 0) {
    return (
      <div className="quiet-empty">
        <p>비교 가능한 재무 변화가 아직 없습니다.</p>
        {!data.financialContext.baseline && <small>매수일 이전 재무 기준점이 필요합니다.</small>}
      </div>
    );
  }
  return (
    <ul className="financial-list">
      {changes.map((change) => (
        <li key={change.metric}>
          <div>
            <span>{explainDebt && change.metric === "TOTAL_DEBT" ? `${change.label}(빌린 돈)` : change.label}</span>
            <strong>{change.changeRate === null ? formatPercent(null) : `${change.direction === "INCREASE" ? "+" : "−"}${formatPercent(change.changeRate)}`}</strong>
          </div>
          <p>{formatPeriod(data.financialContext.baseline?.period, "기준")} {formatMoney(change.baselineValue)} → {formatPeriod(data.financialContext.current?.period, "현재")} {formatMoney(change.currentValue)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function SinceBoughtPage() {
  const { holdingId } = useParams();
  const numericHoldingId = Number(holdingId);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [data, setData] = useState<SinceBoughtResponse | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const latestChange = data?.timeline.filter((item) => item.type !== "PURCHASE" && item.date).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const debtExplainedInLatest = latestChange?.title.includes("총차입금") ?? false;
  const debtAppearsInTimeline = data?.timeline.some((item) => item.title.includes("총차입금")) ?? false;
  const currentOverall = data ? overallState(data.currentRiskState) : null;

  useEffect(() => {
    document.title = "매수 이후 변화 | Bonda";
    if (!Number.isInteger(numericHoldingId) || numericHoldingId <= 0) {
      setPageState("error");
      return;
    }
    const controller = new AbortController();
    setPageState("loading");
    getSinceBought(numericHoldingId, controller.signal)
      .then((response) => {
        setData(response);
        setPageState("ready");
        document.title = `${response.holding.bondName} 매수 이후 | Bonda`;
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPageState("error");
      });
    return () => controller.abort();
  }, [numericHoldingId, retryKey]);

  return <>
    <div className="app-shell pulse-product-page since-shell">
      <AppHeader backLabel="내 채권으로" backTo="/monitoring" />

      <main>
        {pageState === "loading" && (
          <section className="state-panel since-loading" aria-live="polite" aria-busy="true">
            <span className="spinner" aria-hidden="true" />
            <p>매수 이후 변화를 확인하고 있습니다.</p>
          </section>
        )}
        {pageState === "error" && (
          <section className="state-panel error-panel" role="alert">
            <div><h1 className="state-title">변화 기록을 불러오지 못했습니다</h1><p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p></div>
            <button type="button" className="secondary-button" onClick={() => setRetryKey((value) => value + 1)}>다시 불러오기</button>
            <Link className="text-link" to="/monitoring">내 채권으로 돌아가기</Link>
          </section>
        )}
        {pageState === "ready" && data && (
          <>
            <header className="since-identity" aria-labelledby="since-title">
              <p className="since-issuer">{data.holding.issuerName}</p>
              <h1 id="since-title">{data.holding.bondName}</h1>
              <p>매수일 <time dateTime={data.holding.purchaseDate}>{formatDate(data.holding.purchaseDate)}</time></p>
            </header>

            <section className="since-latest" aria-labelledby="since-latest-title">
              {latestChange ? <>
                <p className="section-label">최근 확인된 변화</p>
                <h2 id="since-latest-title">{debtExplainedInLatest ? `${latestChange.title} (빌린 돈)` : latestChange.title}</h2>
                <time dateTime={latestChange.date}>{formatDate(latestChange.date)}</time>
                <p className="since-latest-state">Bonda 현재 상태 · <strong className={currentOverall ? `state-${currentOverall.toLowerCase()}` : undefined}>{currentOverall ? stateLabels[currentOverall] : "계산 전"}</strong></p>
                <p className="since-latest-summary">{latestChange.summary}</p>
                {latestChange.riskEventId && latestChange.evidenceAvailable && <EvidenceDisclosure riskEventId={latestChange.riskEventId} />}
                {latestChange.riskEventId && !latestChange.evidenceAvailable && <p className="evidence-unavailable">연결된 공시 원문이 없습니다.</p>}
              </> : <>
                <h2 id="since-latest-title">새 변화 없음</h2>
                <p>마지막 확인 <time dateTime={data.updatedAt}>{formatDateTime(data.updatedAt)}</time></p>
                <p className="since-latest-state">Bonda 현재 상태 · <strong>{currentOverall ? stateLabels[currentOverall] : "계산 전"}</strong></p>
              </>}
            </section>

            <p className="since-purchase-amount">매수금액 <strong>{formatMoney(data.holding.purchaseAmount)}</strong></p>

            <section className="risk-state-section" aria-label="Bonda 현재 상태 상세">
              <details className="since-risk-details"><summary>전체 상태 보기 <span>{currentOverall ? stateLabels[currentOverall] : "계산 전"}</span></summary>
              {data.currentRiskState && <p>{formatDate(data.currentRiskState.snapshotDate)} 기준</p>}
              {data.currentRiskState ? (
                <dl className="risk-state-grid">
                  {(Object.keys(riskLabels) as Array<keyof typeof riskLabels>).map((key) => {
                    const state = data.currentRiskState![key];
                    return <div key={key}><dt>{riskLabels[key]}</dt><dd className={`state-${state.toLowerCase()}`}>{stateLabels[state]}</dd></div>;
                  })}
                </dl>
              ) : <div className="quiet-empty"><p>계산된 현재 위험 상태가 아직 없습니다.</p></div>}
              </details>
            </section>

            <div className="since-layout">
              <section className="timeline-section" aria-labelledby="timeline-title">
                <div className="section-heading compact-heading">
                  <div><p className="section-label">날짜순 검증 기록</p><h2 id="timeline-title">매수 이후 변화</h2></div>
                  <p>매수일부터 날짜순</p>
                </div>
                <Timeline items={data.timeline} featuredRiskEventId={latestChange?.riskEventId ?? null} explainDebt={!debtExplainedInLatest} />
              </section>

              <aside className="since-aside">
                <section className="financial-section" aria-labelledby="financial-title">
                  <p className="section-label">계산된 변화</p>
                  <h2 id="financial-title">재무 기준점 비교</h2>
                  {data.financialContext.baseline && data.financialContext.current && (
                    <p className="period-comparison">{data.financialContext.baseline.period} → {data.financialContext.current.period}</p>
                  )}
                  <FinancialChangeList changes={data.financialChanges} data={data} explainDebt={!debtExplainedInLatest && !debtAppearsInTimeline} />
                </section>
                {data.explanation.status === "AVAILABLE" && data.explanation.summary && <details className="explanation-section"><summary>참고 설명 <small>AI 생성 참고 정보</small></summary><p className="explanation-copy">{data.explanation.summary}</p><small>검증된 변화만 정리하며, 위험 상태 결정에는 사용하지 않습니다.</small></details>}
                {data.explanation.status === "FAILED" && <p className="since-explanation-error">참고 설명을 만들지 못했습니다. 검증된 기록은 그대로 확인할 수 있습니다.</p>}
              </aside>
            </div>
          </>
        )}
      </main>
      <footer><p>검증된 변화를 보고, 판단은 직접 합니다.</p></footer>
    </div>
    <MobileNav />
  </>;
}
