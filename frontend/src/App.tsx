import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
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
import SignalLine from "./SignalLine";
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
  const navigate = useNavigate();
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

  async function handleAlertOpen(event: ReactMouseEvent<HTMLAnchorElement>, alert: AlertItem) {
    event.preventDefault();
    if (pendingAlertId !== null) return;
    if (alert.isRead) {
      navigate(alertTarget(alert));
      return;
    }
    setPendingAlertId(alert.alertId);
    setAlertError("");
    try {
      const updated = await markAlertRead(alert.alertId);
      setAlerts((current) => current.map((item) => item.alertId === updated.alertId ? updated : item));
      setMyBonds((current) => current.map((item) => item.holdingId === updated.holdingId
        ? { ...item, unreadAlertCount: Math.max(0, item.unreadAlertCount - 1) }
        : item));
      navigate(alertTarget(updated));
    } catch {
      setAlertError("알림을 읽음 처리하지 못했습니다. 다시 눌러 주세요.");
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
  const today = getLocalToday();
  const introSummary = pageState === "loading"
    ? "보유 채권의 새로운 변화를 확인하고 있습니다."
    : pageState === "error"
      ? "현재 변화 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요."
      : unreadCount > 0
        ? `확인하지 않은 변화 ${unreadCount}개가 있습니다.`
        : "아직 새롭게 확인된 변화가 없어요. 등록한 채권을 계속 확인하고 있습니다.";

  return (
    <div className="app-shell monitoring-shell">
      <AppHeader status={pageState === "error" ? "연결 확인 필요" : unreadCount > 0 ? `새 알림 ${unreadCount}개` : "모니터링 중"} />
      <main>
        <section className="monitoring-hero" aria-labelledby="page-title">
          <div className="monitoring-hero-copy">
            <p className="eyebrow">MY BONDS, SINCE I BOUGHT</p>
            <h1 id="page-title">내가 산 채권,<br />그 뒤 회사에 무슨 일이 있었는지<br /><em>Bonda</em>가 계속 보고 있습니다.</h1>
            <p>{introSummary}</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#my-bonds">내 채권 둘러보기 <span aria-hidden="true">→</span></a>
              <a className="secondary-cta" href="#watchlist">채권 등록하기</a>
            </div>
            <dl className="hero-stats">
              <div><dt>보유 채권</dt><dd>{pageState === "ready" ? `${myBonds.length}개` : "—"}</dd></div>
              <div><dt>관심 채권</dt><dd>{pageState === "ready" ? `${watchlist.length}개` : "—"}</dd></div>
              <div><dt>새 변화</dt><dd>{pageState === "ready" ? `${unreadCount}개` : "—"}</dd></div>
            </dl>
          </div>
          <div className="monitoring-hero-visual">
            <p>시간이 흐를수록,<br />더 명확한 신호로</p>
            <SignalLine />
          </div>
        </section>

        {pageState === "loading" && (
          <section className="state-panel" aria-live="polite" aria-busy="true"><span className="spinner" aria-hidden="true" /><p>보유 채권의 변화를 확인하고 있습니다.</p></section>
        )}
        {pageState === "error" && (
          <section className="state-panel error-panel" role="alert">
            <div><h2>모니터링 정보를 불러오지 못했습니다</h2><p>연결 상태를 확인한 뒤 다시 시도해 주세요.</p></div>
            <button type="button" className="secondary-button" onClick={() => void loadPortfolio()}>다시 불러오기</button>
          </section>
        )}

        {pageState === "ready" && (
          <>
            <div className="monitoring-grid">
            <section id="my-bonds" className="my-bonds-section" aria-labelledby="my-bonds-title">
              <div className="section-heading">
                <div><p className="section-label">CHANGE FIRST</p><h2 id="my-bonds-title">내 채권</h2></div>
                <p><strong>{myBonds.length}</strong>건 보유</p>
              </div>
              {myBonds.length === 0 ? (
                <div className="empty-state monitoring-empty"><h3>보유 채권이 아직 없어요.</h3><p>아래에서 채권을 등록하면 매수일 이후 변화를 계속 확인할 수 있습니다.</p></div>
              ) : (
                <ol className="holding-monitor-list">
                  {myBonds.map((holding) => {
                    const bond = bonds.find((item) => item.id === holding.bondId);
                    return (
                    <li key={holding.holdingId} className={holding.unreadAlertCount > 0 ? "has-unread" : ""}>
                      <div className="holding-monitor-main">
                        <div className="holding-monitor-title"><p>{holding.issuerName}</p><h3><Link to={`/holdings/${holding.holdingId}/since-bought`}>{holding.bondName}</Link></h3></div>
                        <div className="holding-signal">
                          {holding.unreadAlertCount > 0 && <span className="unread-count">읽지 않은 변화 {holding.unreadAlertCount}</span>}
                          {holding.currentRiskState
                            ? <span className={`state-tag state-${holding.currentRiskState.overall.toLowerCase()}`}>{stateLabels[holding.currentRiskState.overall]}</span>
                            : <span className="state-missing">상태 계산 전</span>}
                        </div>
                      </div>
                      <div className="holding-change-copy">
                        {holding.latestRiskChange ? (
                          <p><strong>{categoryLabels[holding.latestRiskChange.category]}</strong> {stateLabels[holding.latestRiskChange.previousState]} → {stateLabels[holding.latestRiskChange.currentState]}</p>
                        ) : <p>매수 이후 Risk State 변화가 아직 없습니다.</p>}
                        {holding.latestAlert && <small>{holding.latestAlert.message}</small>}
                      </div>
                      <dl className="holding-metrics">
                        <div><dt>표면금리</dt><dd>{bond ? `${bond.couponRate.toFixed(3)}%` : "—"}</dd></div>
                        <div><dt>신용등급</dt><dd>{bond?.creditRating ?? "—"}</dd></div>
                        <div><dt>만기일</dt><dd>{bond ? formatDate(bond.maturityDate) : "—"}</dd></div>
                        <div><dt>매수금액</dt><dd>{formatMoney(holding.purchaseAmount)}</dd></div>
                      </dl>
                      <div className="holding-monitor-footer">
                        <span>{formatDate(holding.purchaseDate)} 매수</span>
                        <span>검증 Event {holding.newEventCount}개</span>
                        <Link to={`/holdings/${holding.holdingId}/since-bought`}>Since I Bought <span aria-hidden="true">→</span></Link>
                      </div>
                    </li>
                  )})}
                </ol>
              )}
            </section>

            <section id="alerts" className="alerts-section" aria-labelledby="alerts-title">
              <div className="section-heading">
                <div><p className="section-label">RECENT ALERTS</p><h2 id="alerts-title">최근 알림</h2></div>
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
                      <Link to={alertTarget(alert)} onClick={(event) => void handleAlertOpen(event, alert)} aria-busy={pendingAlertId === alert.alertId}>
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
      <footer><p>Bonda monitors change. Decisions remain yours.</p></footer>
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
