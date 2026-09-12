import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import {
  ApiError,
  createHolding,
  createWatchlist,
  getAlerts,
  getBonds,
  getMyBonds,
  getWatchlist,
  markAlertRead,
} from "./api";
import RiskEventPage from "./RiskEventPage";
import SinceBoughtPage from "./SinceBoughtPage";
import HistoricalReplayPage from "./HistoricalReplayPage";
import { AppHeader, MobileNav } from "./Navigation";
import type { AlertItem, Bond, MyBondSummary, RiskState, WatchlistEntry } from "./types";

type PageState = "loading" | "ready" | "error";

const stateLabels: Record<RiskState, string> = { NORMAL: "정상", WATCH: "관찰", CAUTION: "주의" };
const categoryLabels = {
  LIQUIDITY: "유동성",
  CASH_FLOW: "현금흐름",
  LEVERAGE: "부채 부담",
  EARNINGS: "수익성",
  CREDIT: "신용",
} as const;
const severityLabels = { INFO: "새 변화", WATCH: "관찰", IMPORTANT: "중요 변화" } as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00+09:00`));
}

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function alertTarget(alert: AlertItem) {
  if (alert.targetType === "RISK_EVENT") return `/risk-events/${alert.targetId}`;
  if (alert.targetType === "SINCE_BOUGHT") return `/holdings/${alert.targetId}/since-bought`;
  return "/#watchlist";
}

function PortfolioPage() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [myBonds, setMyBonds] = useState<MyBondSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [alertError, setAlertError] = useState("");
  const [pendingAlertId, setPendingAlertId] = useState<number | null>(null);
  const [holdingBondId, setHoldingBondId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [holdingError, setHoldingError] = useState("");
  const [holdingNotice, setHoldingNotice] = useState("");
  const [holdingPending, setHoldingPending] = useState(false);
  const [watchBondId, setWatchBondId] = useState("");
  const [watchError, setWatchError] = useState("");
  const [watchNotice, setWatchNotice] = useState("");
  const [watchPending, setWatchPending] = useState(false);
  const holdingBondRef = useRef<HTMLSelectElement>(null);
  const purchaseDateRef = useRef<HTMLInputElement>(null);
  const purchaseAmountRef = useRef<HTMLInputElement>(null);
  const watchBondRef = useRef<HTMLSelectElement>(null);

  async function loadPortfolio(signal?: AbortSignal) {
    setPageState("loading");
    try {
      const [bondList, summaries, recentAlerts, watchlistEntries] = await Promise.all([
        getBonds(signal),
        getMyBonds(signal),
        getAlerts(signal),
        getWatchlist(signal),
      ]);
      setBonds(bondList);
      setMyBonds(summaries);
      setAlerts(recentAlerts);
      setWatchlist(watchlistEntries);
      setPageState("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPageState("error");
    }
  }

  useEffect(() => {
    document.title = "내 채권 | Bonda";
    const controller = new AbortController();
    void loadPortfolio(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (pageState !== "ready" || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageState]);

  async function handleAlertRead(alert: AlertItem) {
    if (pendingAlertId !== null) return;
    if (alert.isRead) return;
    setPendingAlertId(alert.alertId);
    setAlertError("");
    try {
      const updated = await markAlertRead(alert.alertId);
      setAlerts((current) => current.map((item) => item.alertId === updated.alertId ? updated : item));
      setMyBonds((current) => current.map((item) => item.holdingId === updated.holdingId
        ? { ...item, unreadAlertCount: Math.max(0, item.unreadAlertCount - 1) }
        : item));
    } catch {
      setAlertError("상세 화면은 열었지만 읽음 상태를 저장하지 못했습니다.");
    } finally {
      setPendingAlertId(null);
    }
  }

  async function handleHoldingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHoldingError("");
    setHoldingNotice("");
    if (!holdingBondId) {
      setHoldingError("보유할 채권을 선택해 주세요.");
      holdingBondRef.current?.focus();
      return;
    }
    if (!purchaseDate) {
      setHoldingError("매수일을 입력해 주세요.");
      purchaseDateRef.current?.focus();
      return;
    }
    if (purchaseDate > getLocalToday()) {
      setHoldingError("매수일은 오늘 또는 이전 날짜로 입력해 주세요.");
      purchaseDateRef.current?.focus();
      return;
    }
    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      setHoldingError("매수금액을 0원보다 크게 입력해 주세요.");
      purchaseAmountRef.current?.focus();
      return;
    }
    setHoldingPending(true);
    try {
      const holding = await createHolding({ bondId: Number(holdingBondId), purchaseDate, purchaseAmount });
      setPurchaseDate("");
      setPurchaseAmount("");
      await loadPortfolio();
      setHoldingNotice(`${holding.bond.name}: 보유 채권으로 등록했습니다.`);
    } catch {
      setHoldingError("보유 채권을 등록하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setHoldingPending(false);
    }
  }

  async function handleWatchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWatchError("");
    setWatchNotice("");
    if (!watchBondId) {
      setWatchError("관심 채권을 선택해 주세요.");
      watchBondRef.current?.focus();
      return;
    }
    setWatchPending(true);
    try {
      const entry = await createWatchlist(Number(watchBondId));
      setWatchlist((current) => [entry, ...current]);
      setWatchBondId("");
      setWatchNotice(`${entry.bond.name}: 관심 채권으로 등록했습니다.`);
    } catch (error) {
      setWatchError(error instanceof ApiError && error.status === 409
        ? "이미 관심 채권으로 등록되어 있습니다."
        : "관심 채권을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setWatchPending(false);
    }
  }

  const watchedBondIds = new Set(watchlist.map((entry) => entry.bond.id));
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;
  const attentionCount = myBonds.filter((holding) => holding.currentRiskState && holding.currentRiskState.overall !== "NORMAL").length;
  const firstUnreadHolding = myBonds.find((holding) => holding.unreadAlertCount > 0);
  const today = getLocalToday();
  const overviewTitle = pageState === "loading"
    ? "내 채권의 변화를 확인하고 있습니다."
    : pageState === "error"
      ? "지금은 변화를 불러올 수 없습니다."
      : unreadCount > 0
        ? `확인할 변화가 ${unreadCount}개 있습니다.`
        : "새롭게 확인된 변화가 없습니다.";
  const overviewSummary = pageState === "ready"
    ? myBonds.length > 0
      ? `보유 채권 ${myBonds.length}건의 발행기업을 계속 확인하고 있습니다.`
      : "채권과 매수일을 등록하면 그 이후의 변화를 확인할 수 있습니다."
    : pageState === "error"
      ? "연결 상태를 확인한 뒤 다시 시도해 주세요."
      : "공시와 위험 상태를 최신 순서로 불러오는 중입니다.";
  const overviewAction = myBonds.length === 0
    ? { href: "#watchlist", label: "채권 등록하기" }
    : firstUnreadHolding
      ? { href: `#holding-${firstUnreadHolding.holdingId}`, label: "새 변화부터 보기" }
      : { href: "#my-bonds", label: "내 채권 보기" };

  return (
    <div className="app-shell monitoring-shell">
      <AppHeader status={pageState === "error" ? "연결 확인 필요" : unreadCount > 0 ? `새 알림 ${unreadCount}개` : "모니터링 중"} />
      <main>
        <section className={`portfolio-overview overview-${pageState}`} aria-labelledby="page-title">
          <div className="portfolio-overview-copy">
            <p className="portfolio-context"><span aria-hidden="true" />내 채권 모니터링</p>
            <h1 id="page-title">{overviewTitle}</h1>
            <p className="portfolio-summary">{overviewSummary}</p>
            {pageState === "ready" && (
              <a className="primary-cta" href={overviewAction.href}>{overviewAction.label}<span aria-hidden="true">→</span></a>
            )}
            {pageState === "error" && (
              <button type="button" className="secondary-button" onClick={() => void loadPortfolio()}>다시 불러오기</button>
            )}
          </div>
          <dl className="portfolio-facts" aria-label="포트폴리오 요약">
            <div><dt>보유</dt><dd>{pageState === "ready" ? myBonds.length : "—"}<span>건</span></dd></div>
            <div><dt>관찰·주의</dt><dd>{pageState === "ready" ? attentionCount : "—"}<span>건</span></dd></div>
            <div><dt>관심</dt><dd>{pageState === "ready" ? watchlist.length : "—"}<span>건</span></dd></div>
          </dl>
        </section>

        {pageState === "loading" && (
          <section className="state-panel" aria-live="polite" aria-busy="true"><span className="spinner" aria-hidden="true" /><p>보유 채권의 변화를 확인하고 있습니다.</p></section>
        )}
        {pageState === "ready" && (
          <>
            <div className="monitoring-grid">
            <section id="my-bonds" className="my-bonds-section" aria-labelledby="my-bonds-title">
              <div className="section-heading">
                <div><h2 id="my-bonds-title">내 채권</h2><p className="section-description">새 변화가 있는 채권부터 보여드립니다.</p></div>
                <p><strong>{myBonds.length}</strong>건 보유</p>
              </div>
              {myBonds.length === 0 ? (
                <div className="empty-state monitoring-empty"><h3>보유 채권이 아직 없어요.</h3><p>아래에서 채권을 등록하면 매수일 이후 변화를 계속 확인할 수 있습니다.</p></div>
              ) : (
                <ol className="holding-monitor-list">
                  {myBonds.map((holding) => {
                    const bond = bonds.find((item) => item.id === holding.bondId);
                    return (
                    <li id={`holding-${holding.holdingId}`} key={holding.holdingId} className={holding.unreadAlertCount > 0 ? "has-unread" : ""}>
                      <Link className="holding-row-link" to={`/holdings/${holding.holdingId}/since-bought`} aria-label={`${holding.bondName} 매수 이후 변화 보기`}>
                        <div className="holding-monitor-main">
                          <div className="holding-monitor-title"><p>{holding.issuerName}</p><h3>{holding.bondName}</h3></div>
                          <div className="holding-signal">
                            {holding.unreadAlertCount > 0 && <span className="unread-count">새 변화 {holding.unreadAlertCount}</span>}
                            {holding.currentRiskState
                              ? <span className={`state-tag state-${holding.currentRiskState.overall.toLowerCase()}`}>{stateLabels[holding.currentRiskState.overall]}</span>
                              : <span className="state-missing">상태 계산 전</span>}
                          </div>
                        </div>
                        <div className="holding-change-copy">
                          {holding.latestRiskChange ? (
                            <p><strong>{categoryLabels[holding.latestRiskChange.category]}</strong> {stateLabels[holding.latestRiskChange.previousState]} → {stateLabels[holding.latestRiskChange.currentState]}</p>
                          ) : <p>매수 이후 위험 상태 변화가 없습니다.</p>}
                          {holding.latestAlert && <small>최근 알림 · {holding.latestAlert.message}</small>}
                        </div>
                        <div className="holding-change-spine" aria-label={`매수일 ${formatDate(holding.purchaseDate)}${holding.latestActivityAt ? `, 최근 변화 ${formatDateTime(holding.latestActivityAt)}` : ""}`}>
                          <div><span className="spine-node" aria-hidden="true" /><time dateTime={holding.purchaseDate}>{formatShortDate(holding.purchaseDate)}</time><small>매수</small></div>
                          <span className="spine-track" aria-hidden="true" />
                          <div className={holding.latestActivityAt ? "is-current" : "is-quiet"}><span className="spine-node" aria-hidden="true" />{holding.latestActivityAt ? <time dateTime={holding.latestActivityAt}>{formatShortDate(holding.latestActivityAt)}</time> : <span>현재</span>}<small>{holding.latestActivityAt ? "최근 변화" : "계속 확인 중"}</small></div>
                        </div>
                        <dl className="holding-metrics">
                          <div><dt>신용등급</dt><dd>{bond?.creditRating ?? "—"}</dd></div>
                          <div><dt>표면금리</dt><dd>{bond ? `${bond.couponRate.toFixed(3)}%` : "—"}</dd></div>
                          <div><dt>만기일</dt><dd>{bond ? formatDate(bond.maturityDate) : "—"}</dd></div>
                          <div><dt>매수금액</dt><dd>{formatMoney(holding.purchaseAmount)}</dd></div>
                        </dl>
                        <div className="holding-monitor-footer">
                          <span>검증된 변화 {holding.newEventCount}건</span>
                          <span className="holding-row-action">매수 이후 변화 보기 <span aria-hidden="true">→</span></span>
                        </div>
                      </Link>
                    </li>
                  )})}
                </ol>
              )}
            </section>

            <section id="alerts" className="alerts-section" aria-labelledby="alerts-title">
              <div className="section-heading">
                <div><h2 id="alerts-title">최근 알림</h2><p className="section-description">검증된 변화만 알립니다.</p></div>
                <p>{unreadCount > 0 ? `${unreadCount}개 안 읽음` : "모두 확인함"}</p>
              </div>
              {alertError && <p className="alert-action-error" role="alert">{alertError}</p>}
              {alerts.length === 0 ? (
                <div className="empty-state monitoring-empty"><h3>아직 새롭게 확인된 변화가 없어요.</h3><p>검증된 변화가 생기면 이곳에서 알려드릴게요.</p></div>
              ) : (
                <ol className="alert-list">
                  {alerts.map((alert) => (
                    <li key={alert.alertId} className={!alert.isRead ? "is-unread" : ""}>
                      <div className="alert-meta">
                        <span className={`alert-severity severity-${alert.severity.toLowerCase()}`}>{severityLabels[alert.severity]}</span>
                        <time dateTime={alert.createdAt}>{formatDateTime(alert.createdAt)}</time>
                        {!alert.isRead && <span className="unread-dot">안 읽음</span>}
                      </div>
                      <p className="alert-bond-name">{alert.bondName}</p>
                      <h3>{alert.title}</h3>
                      <p>{alert.message}</p>
                      <Link to={alertTarget(alert)} onClick={() => void handleAlertRead(alert)} aria-busy={pendingAlertId === alert.alertId}>
                        {pendingAlertId === alert.alertId ? "읽음 처리 중…" : alert.targetType === "RISK_EVENT" ? "원문 근거 보기 →" : "변화 자세히 보기 →"}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            </div>

            <section id="watchlist" className="registration-section" aria-labelledby="registration-title">
              <div className="section-heading"><div><p className="section-label">PORTFOLIO SETUP</p><h2 id="registration-title">내 목록에 등록</h2></div></div>
              <div className="form-grid">
                <form className="entry-form" onSubmit={handleHoldingSubmit} noValidate>
                  <div className="form-heading"><span className="form-index">01</span><div><h3>보유 채권 등록</h3><p>실제 매수한 금액과 날짜를 기록합니다.</p></div></div>
                  <label htmlFor="holding-bond">채권</label>
                  <select ref={holdingBondRef} id="holding-bond" value={holdingBondId} onChange={(event) => setHoldingBondId(event.target.value)} aria-invalid={Boolean(holdingError) && !holdingBondId} aria-describedby={holdingError ? "holding-error" : undefined} required>
                    <option value="">채권을 선택해 주세요</option>
                    {bonds.map((bond) => <option key={bond.id} value={bond.id}>{bond.name}</option>)}
                  </select>
                  <div className="field-row">
                    <div><label htmlFor="purchase-date">매수일</label><input ref={purchaseDateRef} id="purchase-date" type="date" value={purchaseDate} max={today} onChange={(event) => setPurchaseDate(event.target.value)} aria-invalid={Boolean(holdingError) && (!purchaseDate || purchaseDate > today)} aria-describedby={holdingError ? "holding-error" : undefined} required /></div>
                    <div><label htmlFor="purchase-amount">매수금액</label><div className="amount-field"><input ref={purchaseAmountRef} id="purchase-amount" type="number" min="1" step="1" inputMode="numeric" value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} aria-invalid={Boolean(holdingError) && (!purchaseAmount || Number(purchaseAmount) <= 0)} aria-describedby={holdingError ? "holding-error" : "amount-help"} required /><span>원</span></div><span id="amount-help" className="field-help">{purchaseAmount && Number(purchaseAmount) > 0 ? formatMoney(Number(purchaseAmount)) : "원금 기준"}</span></div>
                  </div>
                  <div className="form-message" aria-live="polite">{holdingError && <p id="holding-error" role="alert">{holdingError}</p>}{holdingNotice && <p className="success-message">{holdingNotice}</p>}</div>
                  <button type="submit" disabled={holdingPending || bonds.length === 0} aria-busy={holdingPending}>{holdingPending ? "등록 중…" : "보유 채권 등록"}</button>
                </form>
                <form className="entry-form" onSubmit={handleWatchSubmit} noValidate>
                  <div className="form-heading"><span className="form-index">02</span><div><h3>관심 채권 등록</h3><p>매수 전에도 발행기업 변화를 지켜봅니다.</p></div></div>
                  <label htmlFor="watch-bond">채권</label>
                  <select ref={watchBondRef} id="watch-bond" value={watchBondId} onChange={(event) => setWatchBondId(event.target.value)} aria-invalid={Boolean(watchError) && !watchBondId} aria-describedby={watchError ? "watch-error" : undefined} required>
                    <option value="">채권을 선택해 주세요</option>
                    {bonds.map((bond) => <option key={bond.id} value={bond.id} disabled={watchedBondIds.has(bond.id)}>{bond.name}{watchedBondIds.has(bond.id) ? " · 등록됨" : ""}</option>)}
                  </select>
                  <div className="watchlist-summary"><span>현재 관심 채권</span><strong>{watchlist.length}개</strong></div>
                  <div className="form-message" aria-live="polite">{watchError && <p id="watch-error" role="alert">{watchError}</p>}{watchNotice && <p className="success-message">{watchNotice}</p>}</div>
                  <button type="submit" disabled={watchPending || bonds.length === 0} aria-busy={watchPending}>{watchPending ? "등록 중…" : "관심 채권 등록"}</button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>
      <MobileNav />
      <footer><p>검증된 변화만 보여드립니다.</p></footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/holdings/:holdingId/since-bought" element={<SinceBoughtPage />} />
      <Route path="/risk-events/:riskEventId" element={<RiskEventPage />} />
      <Route path="/admin/replay" element={<HistoricalReplayPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
