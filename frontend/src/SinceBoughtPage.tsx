import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRiskEvent, getSinceBought } from "./api";
import { AppHeader, MobileNav } from "./Navigation";
import SignalLine from "./SignalLine";
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
        {open ? "원문 접기" : "원문에서 확인하기"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="evidence-panel" aria-live="polite">
          {state?.status === "loading" && <p>검증된 원문을 불러오고 있어요.</p>}
          {state?.status === "error" && (
            <div className="inline-error" role="alert">
              <p>원문 근거를 불러오지 못했습니다.</p>
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
                <p>연결된 근거 구간이 없습니다.</p>
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

function Timeline({ items }: { items: SinceBoughtTimelineItem[] }) {
  const changeCount = items.filter((item) => item.type !== "PURCHASE").length;
  return (
    <>
      <ol className="risk-timeline" aria-label={`매수 이후 ${changeCount}개의 변화`}>
        {items.map((item, index) => (
          <li key={`${item.type}-${item.date}-${item.riskEventId ?? item.riskChangeId ?? index}`} className={`timeline-${item.type.toLowerCase()}`}>
            <div className="timeline-marker" aria-hidden="true" />
            <article>
              <div className="timeline-meta">
                <time dateTime={item.date}>{formatDate(item.date)}</time>
                <span>{timelineLabels[item.type]}</span>
                {item.severity && <span className={`state-tag state-${item.severity.toLowerCase()}`}>{stateLabels[item.severity]}</span>}
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              {item.riskEventId && item.evidenceAvailable && <EvidenceDisclosure riskEventId={item.riskEventId} />}
              {item.riskEventId && !item.evidenceAvailable && <p className="evidence-unavailable">연결된 원문 근거가 없습니다.</p>}
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

function FinancialChangeList({ changes, data }: { changes: FinancialChange[]; data: SinceBoughtResponse }) {
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
            <span>{change.label}</span>
            <strong className={change.direction === "INCREASE" ? "trend-up" : "trend-down"}>
              {change.direction === "INCREASE" ? "↑" : "↓"} {formatPercent(change.changeRate)}
            </strong>
          </div>
          <p>{formatMoney(change.baselineValue)} → {formatMoney(change.currentValue)}</p>
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

  return (
    <div className="app-shell since-shell">
      <AppHeader backLabel="내 채권으로" />

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
            <Link className="text-link" to="/">내 채권으로 돌아가기</Link>
          </section>
        )}
        {pageState === "ready" && data && (
          <>
            <section className="since-hero" aria-labelledby="since-title">
              <div className="since-hero-copy">
                <p className="eyebrow">SINCE I BOUGHT</p>
                <p className="since-issuer">{data.holding.issuerName}</p>
                <h1 id="since-title">{data.holding.bondName}</h1>
                <p className="since-question">내가 산 뒤, 회사에 무엇이 달라졌을까요?</p>
                <p className="change-count">
                  매수 이후 <strong>{data.timeline.filter((item) => item.type !== "PURCHASE").length}개의 변화</strong>가 있었어요.
                </p>
                <dl className="since-purchase-facts">
                  <div><dt>매수일</dt><dd>{formatDate(data.holding.purchaseDate)}</dd></div>
                  <div><dt>매수금액</dt><dd>{formatMoney(data.holding.purchaseAmount)}</dd></div>
                </dl>
              </div>
              <div className="since-hero-visual">
                <p>시간이 흐를수록,<br />더 명확한 변화만</p>
                <SignalLine compact />
              </div>
            </section>

            <section className="risk-state-section" aria-labelledby="current-state-title">
              <div className="section-heading compact-heading">
                <div><p className="section-label">CURRENT STATE</p><h2 id="current-state-title">현재 확인 상태</h2></div>
                {data.currentRiskState && <p>{formatDate(data.currentRiskState.snapshotDate)} 기준</p>}
              </div>
              {data.currentRiskState ? (
                <dl className="risk-state-grid">
                  {(Object.keys(riskLabels) as Array<keyof typeof riskLabels>).map((key) => {
                    const state = data.currentRiskState![key];
                    return <div key={key}><dt>{riskLabels[key]}</dt><dd className={`state-${state.toLowerCase()}`}>{stateLabels[state]}</dd></div>;
                  })}
                </dl>
              ) : <div className="quiet-empty"><p>계산된 현재 위험 상태가 아직 없습니다.</p></div>}
            </section>

            <div className="since-layout">
              <section className="timeline-section" aria-labelledby="timeline-title">
                <div className="section-heading compact-heading">
                  <div><p className="section-label">CHANGE TIMELINE</p><h2 id="timeline-title">Since I Bought</h2></div>
                  <p>매수일부터 날짜순</p>
                </div>
                <Timeline items={data.timeline} />
              </section>

              <aside className="since-aside">
                <section className="explanation-section" aria-labelledby="explanation-title">
                  <p className="section-label">BONDA INTERPRETATION</p>
                  <h2 id="explanation-title">Bonda의 해석</h2>
                  {data.explanation.status === "AVAILABLE" && <p className="explanation-copy">{data.explanation.summary}</p>}
                  {data.explanation.status === "NOT_NEEDED" && <p className="muted-copy">설명할 새로운 변화가 아직 없습니다.</p>}
                  {data.explanation.status === "FAILED" && <p className="muted-copy">변화 요약을 만들지 못했어요. 위의 검증된 기록은 그대로 확인할 수 있습니다.</p>}
                  <small>검증된 변화만 짧게 정리하며, 위험 상태 결정에는 사용하지 않습니다.</small>
                </section>

                <section className="financial-section" aria-labelledby="financial-title">
                  <p className="section-label">FINANCIAL CHANGE</p>
                  <h2 id="financial-title">재무 기준점 비교</h2>
                  {data.financialContext.baseline && data.financialContext.current && (
                    <p className="period-comparison">{data.financialContext.baseline.period} → {data.financialContext.current.period}</p>
                  )}
                  <FinancialChangeList changes={data.financialChanges} data={data} />
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
      <MobileNav />
      <footer><p>Bonda monitors change. Decisions remain yours.</p></footer>
    </div>
  );
}
