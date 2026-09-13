import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, Route, Routes, useSearchParams } from "react-router-dom";
import {
  ApiError,
  createHolding,
  createWatchlist,
  deleteHolding,
  deleteWatchlist,
  getAlerts,
  getBonds,
  getMyBonds,
  getWatchlist,
  markAlertRead,
} from "./api";
import RiskEventPage from "./RiskEventPage";
import SinceBoughtPage from "./SinceBoughtPage";
import HistoricalReplayPage from "./HistoricalReplayPage";
import LandingPage from "./LandingPage";
import NotFoundPage from "./NotFoundPage";
import DemoMonitoring from "./DemoMonitoring";
import { Dialog, Toast } from "./Dialogs";
import { AppHeader, MobileNav } from "./Navigation";
import type { AlertItem, Bond, MyBondSummary, RiskState, WatchlistEntry } from "./types";

type PageState = "initial-loading" | "ready" | "refreshing" | "stale" | "error";
type PortfolioFailureKind = "connection" | "temporary";

type PortfolioFailure = {
  kind: PortfolioFailureKind;
  consecutiveCount: number;
};

type WorkspaceTab = "overview" | "facts" | "metrics" | "insight" | "timeline";
type WorkspaceFilter = "all" | "signals" | "investment" | "short";

type PortfolioSnapshot = {
  bonds: Bond[];
  myBonds: MyBondSummary[];
  alerts: AlertItem[];
  watchlist: WatchlistEntry[];
  checkedAt: string;
};

const PORTFOLIO_SNAPSHOT_KEY = "bonda.portfolio.last-success";

function readPortfolioSnapshot(): PortfolioSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(PORTFOLIO_SNAPSHOT_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as Partial<PortfolioSnapshot>;
    if (!Array.isArray(snapshot.bonds)
      || !Array.isArray(snapshot.myBonds)
      || !Array.isArray(snapshot.alerts)
      || !Array.isArray(snapshot.watchlist)
      || typeof snapshot.checkedAt !== "string"
      || Number.isNaN(Date.parse(snapshot.checkedAt))) return null;
    return snapshot as PortfolioSnapshot;
  } catch {
    return null;
  }
}

function storePortfolioSnapshot(snapshot: PortfolioSnapshot) {
  try {
    window.sessionStorage.setItem(PORTFOLIO_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // The live response remains usable when browser storage is unavailable.
  }
}

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

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
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
  return "/monitoring#watchlist";
}

function classifyPortfolioFailure(error: unknown): PortfolioFailureKind {
  if (error instanceof TypeError) return "connection";
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return "connection";
  return "temporary";
}

function PortfolioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialSnapshot] = useState(readPortfolioSnapshot);
  const [bonds, setBonds] = useState<Bond[]>(() => initialSnapshot?.bonds ?? []);
  const [myBonds, setMyBonds] = useState<MyBondSummary[]>(() => initialSnapshot?.myBonds ?? []);
  const [alerts, setAlerts] = useState<AlertItem[]>(() => initialSnapshot?.alerts ?? []);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(() => initialSnapshot?.watchlist ?? []);
  const [pageState, setPageState] = useState<PageState>(initialSnapshot ? "refreshing" : "initial-loading");
  const [portfolioFailure, setPortfolioFailure] = useState<PortfolioFailure | null>(null);
  const [lastSuccessfulAt, setLastSuccessfulAt] = useState<string | null>(initialSnapshot?.checkedAt ?? null);
  const [recoveryPending, setRecoveryPending] = useState(false);
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
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");
  const [selectedHoldingId, setSelectedHoldingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>(() => (searchParams.get("filter") as WorkspaceFilter) || "all");
  const [workspaceDialog, setWorkspaceDialog] = useState<"framework" | "diagnosis" | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "holding" | "watchlist"; id: number; name: string } | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [question, setQuestion] = useState("");
  const [questionResult, setQuestionResult] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const holdingBondRef = useRef<HTMLSelectElement>(null);
  const purchaseDateRef = useRef<HTMLInputElement>(null);
  const purchaseAmountRef = useRef<HTMLInputElement>(null);
  const watchBondRef = useRef<HTMLSelectElement>(null);
  const loadInFlightRef = useRef(false);

  async function loadPortfolio(signal?: AbortSignal, intent: "initial" | "background" | "recovery" = "background") {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    const hasSnapshot = lastSuccessfulAt !== null;
    if (intent === "initial") setPageState(hasSnapshot ? "refreshing" : "initial-loading");
    if (intent === "background" && hasSnapshot && pageState !== "stale") setPageState("refreshing");
    if (intent === "recovery") setRecoveryPending(true);
    try {
      const [bondList, summaries, recentAlerts, watchlistEntries] = await Promise.all([
        getBonds(signal),
        getMyBonds(signal),
        getAlerts(signal),
        getWatchlist(signal),
      ]);
      const checkedAt = new Date().toISOString();
      setBonds(bondList);
      setMyBonds(summaries);
      setAlerts(recentAlerts);
      setWatchlist(watchlistEntries);
      setLastSuccessfulAt(checkedAt);
      storePortfolioSnapshot({ bonds: bondList, myBonds: summaries, alerts: recentAlerts, watchlist: watchlistEntries, checkedAt });
      setPortfolioFailure(null);
      setPageState("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const failureKind = classifyPortfolioFailure(error);
      setPortfolioFailure((current) => ({
        kind: failureKind,
        consecutiveCount: current?.kind === failureKind ? current.consecutiveCount + 1 : 1,
      }));
      setPageState(hasSnapshot ? "stale" : "error");
    } finally {
      loadInFlightRef.current = false;
      if (intent === "recovery") setRecoveryPending(false);
    }
  }

  useEffect(() => {
    document.title = "내 채권 | Bonda";
    void loadPortfolio(undefined, "initial");
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery) next.set("q", searchQuery); else next.delete("q");
    if (workspaceFilter !== "all") next.set("filter", workspaceFilter); else next.delete("filter");
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [searchQuery, workspaceFilter, searchParams, setSearchParams]);

  useEffect(() => {
    if (!lastSuccessfulAt) return;
    const revalidate = () => {
      if (document.visibilityState === "visible") void loadPortfolio(undefined, "background");
    };
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("online", revalidate);
    window.addEventListener("focus", revalidate);
    return () => {
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("online", revalidate);
      window.removeEventListener("focus", revalidate);
    };
  }, [lastSuccessfulAt, pageState]);

  useEffect(() => {
    if ((pageState !== "ready" && pageState !== "stale") || !window.location.hash) return;
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

  function runDemoAnalysis() {
    if (analysisPending) return;
    setAnalysisPending(true);
    setAnalysisNotice("");
    window.setTimeout(() => {
      setAnalysisPending(false);
      setAnalysisNotice("재분석 실행 화면을 체험했습니다. 위험 상태와 저장 데이터는 변경되지 않았습니다.");
      setWorkspaceTab("insight");
    }, 900);
  }

  function askDemoQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setQuestionResult("예시 응답: 현재 API에는 추가 질의 기능이 없습니다. 실제 연동 시 검증된 원문과 계산 결과만 입력으로 사용합니다.");
  }

  async function confirmDelete() {
    if (!deleteTarget || deletePending) return;
    setDeletePending(true);
    setDeleteError("");
    try {
      if (deleteTarget.type === "holding") await deleteHolding(deleteTarget.id);
      else await deleteWatchlist(deleteTarget.id);
      const removedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadPortfolio();
      setAnalysisNotice(`${removedName}을(를) 목록에서 삭제했습니다.`);
    } catch {
      setDeleteError("삭제하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setDeletePending(false);
    }
  }

  const watchedBondIds = new Set(watchlist.map((entry) => entry.bond.id));
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;
  const attentionCount = myBonds.filter((holding) => holding.currentRiskState && holding.currentRiskState.overall !== "NORMAL").length;
  const firstUnreadHolding = myBonds.find((holding) => holding.unreadAlertCount > 0);
  const today = getLocalToday();
  const hasSnapshot = lastSuccessfulAt !== null;
  const isPortfolioEmpty = hasSnapshot && myBonds.length === 0 && watchlist.length === 0;
  const hasPortfolioContent = hasSnapshot && !isPortfolioEmpty;
  const filteredHoldings = useMemo(() => myBonds.filter((holding) => {
    const bond = bonds.find((item) => item.id === holding.bondId);
    const query = searchQuery.trim().toLocaleLowerCase("ko-KR");
    const matchesQuery = !query || [holding.bondName, holding.issuerName, bond?.creditRating ?? ""].some((value) => value.toLocaleLowerCase("ko-KR").includes(query));
    if (!matchesQuery) return false;
    if (workspaceFilter === "signals") return Boolean(holding.currentRiskState && holding.currentRiskState.overall !== "NORMAL") || holding.unreadAlertCount > 0;
    if (workspaceFilter === "investment") return Boolean(bond?.creditRating.match(/^(AAA|AA|A|BBB)/));
    if (workspaceFilter === "short") return Boolean(bond && new Date(bond.maturityDate).getTime() - Date.now() <= 365 * 24 * 60 * 60 * 1000);
    return true;
  }), [myBonds, bonds, searchQuery, workspaceFilter]);
  const selectedHolding = filteredHoldings.find((holding) => holding.holdingId === selectedHoldingId) ?? filteredHoldings[0] ?? null;
  const selectedBond = selectedHolding ? bonds.find((bond) => bond.id === selectedHolding.bondId) ?? null : null;
  const failureKind = portfolioFailure?.kind ?? "temporary";
  const repeatedFailure = (portfolioFailure?.consecutiveCount ?? 0) > 1;
  const recoveryLabel = failureKind === "connection" ? "연결 상태 확인" : "다시 시도";
  const recoveryPendingLabel = failureKind === "connection" ? "연결 확인 중…" : "다시 시도 중…";
  const overviewTitle = pageState === "initial-loading"
    ? "내 채권의 변화를 확인하고 있습니다."
    : pageState === "error"
      ? failureKind === "connection"
        ? "서비스에 연결할 수 없습니다."
        : "최신 변화를 가져오지 못했습니다."
      : isPortfolioEmpty
        ? "확인 중인 채권이 없습니다."
        : unreadCount > 0
          ? `확인할 변화가 ${unreadCount}개 있습니다.`
          : "새롭게 확인된 변화가 없습니다.";
  const overviewSummary = pageState === "initial-loading"
    ? "공시와 위험 상태를 최신 순서로 불러오는 중입니다."
    : pageState === "error"
      ? failureKind === "connection"
        ? repeatedFailure
          ? "계속 연결되지 않습니다. 인터넷 연결과 서비스 로그인 상태를 확인해 주세요."
          : "인터넷 연결 또는 서비스 로그인 상태를 확인해 주세요."
        : repeatedFailure
          ? "조회가 계속 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
          : "일시적인 조회 문제입니다. 저장된 정보는 변경되지 않았습니다."
      : isPortfolioEmpty
        ? "첫 채권과 매수일을 등록하면 그 이후의 변화를 추적합니다."
        : pageState === "stale"
          ? `보유 채권 ${myBonds.length}건의 마지막 확인 데이터를 유지하고 있습니다.`
          : pageState === "refreshing"
            ? `보유 채권 ${myBonds.length}건의 최신 변화를 다시 확인하는 중입니다.`
            : `보유 채권 ${myBonds.length}건의 발행기업을 계속 확인하고 있습니다.`;
  const overviewAction = myBonds.length === 0
    ? { href: "#watchlist", label: "첫 채권 등록하기" }
    : firstUnreadHolding
      ? { href: `#holding-${firstUnreadHolding.holdingId}`, label: "새 변화부터 보기" }
      : { href: "#my-bonds", label: "내 채권 보기" };
  const contextTone = pageState === "error"
    ? failureKind === "connection" ? "error" : "warning"
    : pageState === "stale" ? "warning" : pageState === "initial-loading" || pageState === "refreshing" ? "muted" : "normal";
  const contextLabel = pageState === "error"
    ? failureKind === "connection" ? "연결 상태" : "데이터 업데이트"
    : isPortfolioEmpty ? "모니터링 시작" : pageState === "stale" ? "이전 데이터" : "내 채권 모니터링";
  const headerStatus = pageState === "error"
    ? { label: failureKind === "connection" ? "연결 확인 필요" : "업데이트 지연", tone: failureKind === "connection" ? "error" : "warning" }
    : pageState === "stale"
      ? { label: "이전 데이터", tone: "warning" }
      : pageState === "initial-loading" || pageState === "refreshing"
        ? { label: "새로 확인 중", tone: "muted" }
        : unreadCount > 0
          ? { label: `새 알림 ${unreadCount}개`, tone: "warning" }
          : { label: "모니터링 중", tone: "normal" };

  return (
    <div className={`app-shell monitoring-shell portfolio-state-${pageState}`}>
      <AppHeader status={headerStatus.label} statusTone={headerStatus.tone as "normal" | "warning" | "error" | "muted"} />
      <main>
        <section className={`portfolio-overview overview-${pageState}${!hasPortfolioContent ? " is-single-flow" : ""}`} aria-labelledby="page-title">
          <div className="portfolio-overview-copy" aria-live="polite">
            <p className="portfolio-context" data-tone={contextTone}><span aria-hidden="true" />{contextLabel}</p>
            <h1 id="page-title">{overviewTitle}</h1>
            <p className="portfolio-summary">{overviewSummary}</p>
            {(pageState === "ready" || pageState === "refreshing") && (
              <a className="primary-cta" href={overviewAction.href}>{overviewAction.label}<span aria-hidden="true">→</span></a>
            )}
            {pageState === "error" && (
              <div className="error-actions"><button type="button" className="recovery-button" onClick={() => void loadPortfolio(undefined, "recovery")} disabled={recoveryPending} aria-busy={recoveryPending}>{recoveryPending && <span className="spinner" aria-hidden="true" />}<span>{recoveryPending ? recoveryPendingLabel : recoveryLabel}</span></button><button type="button" className="secondary-button" onClick={() => setDemoMode(true)}>데모 데이터로 화면 보기</button></div>
            )}
          </div>
          {hasPortfolioContent && (
            <div className="portfolio-facts-wrap">
              <dl className="portfolio-facts" aria-label="포트폴리오 요약">
                <div><dt>보유</dt><dd>{myBonds.length}<span>건</span></dd></div>
                <div><dt>관찰·주의</dt><dd>{attentionCount}<span>건</span></dd></div>
                <div><dt>관심</dt><dd>{watchlist.length}<span>건</span></dd></div>
              </dl>
              {lastSuccessfulAt && <p className="portfolio-checked-at">마지막 확인 <time dateTime={lastSuccessfulAt}>{formatCheckedAt(lastSuccessfulAt)}</time></p>}
            </div>
          )}
        </section>

        {pageState === "initial-loading" && (
          <section className="state-panel" aria-live="polite" aria-busy="true"><span className="spinner" aria-hidden="true" /><p>보유 채권의 변화를 확인하고 있습니다.</p></section>
        )}
        {demoMode && pageState === "error" && <DemoMonitoring />}
        {pageState === "stale" && portfolioFailure && lastSuccessfulAt && (
          <section className="portfolio-status-banner" role="status" aria-live="polite">
            <div>
              <h2>{failureKind === "connection" ? "연결이 끊겨 이전 데이터를 표시합니다." : "최신 조회가 지연되어 이전 데이터를 표시합니다."}</h2>
              <p><time dateTime={lastSuccessfulAt}>{formatCheckedAt(lastSuccessfulAt)}</time>에 정상 확인한 데이터입니다.</p>
              {repeatedFailure && <p className="recovery-guidance">{failureKind === "connection" ? "인터넷 연결과 서비스 로그인 상태를 확인한 뒤 다시 확인해 주세요." : "일시적인 서비스 지연이 계속되고 있습니다. 잠시 후 다시 시도해 주세요."}</p>}
            </div>
            <button type="button" className="recovery-button" onClick={() => void loadPortfolio(undefined, "recovery")} disabled={recoveryPending} aria-busy={recoveryPending}>
              {recoveryPending && <span className="spinner" aria-hidden="true" />}
              <span>{recoveryPending ? recoveryPendingLabel : recoveryLabel}</span>
            </button>
          </section>
        )}
        {hasSnapshot && (
          <>
            {!isPortfolioEmpty && (
              <section className="credit-workspace" aria-labelledby="workspace-title">
                <header className="workspace-toolbar">
                  <div><p className="context-label"><span />신용 변화 작업공간</p><h2 id="workspace-title">내 채권 리포트</h2></div>
                  <div className="workspace-tools">
                    <label className="workspace-search" htmlFor="workspace-search"><span className="sr-only">채권 검색</span><input ref={searchRef} id="workspace-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="채권명, 발행사, 등급 검색" />{searchQuery && <button type="button" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기">×</button>}</label>
                    <button type="button" className="secondary-button" onClick={() => setWorkspaceDialog("diagnosis")}>새 채권 진단</button>
                    <button type="button" className="icon-button" onClick={() => setWorkspaceDialog("framework")} aria-label="분석 구조 설명">?</button>
                  </div>
                </header>
                <div className="workspace-filter" aria-label="채권 필터">{([
                  ["all", "전체"], ["signals", "변화 있음"], ["investment", "투자등급"], ["short", "1년 이내 만기"],
                ] as Array<[WorkspaceFilter, string]>).map(([value, label]) => <button key={value} type="button" aria-pressed={workspaceFilter === value} onClick={() => setWorkspaceFilter(value)}>{label}</button>)}</div>
                <div className="workspace-frame">
                  <aside className="workspace-sidebar" aria-label="보유 채권 선택">
                    <div className="workspace-sidebar-heading"><strong>보유 채권</strong><span>{filteredHoldings.length}건</span></div>
                    {filteredHoldings.length === 0 ? <div className="workspace-no-results"><p>검색 조건에 맞는 채권이 없습니다.</p><button type="button" onClick={() => { setSearchQuery(""); setWorkspaceFilter("all"); }}>조건 초기화</button></div> : filteredHoldings.map((holding) => {
                      const bond = bonds.find((item) => item.id === holding.bondId);
                      return <button className="workspace-bond" type="button" key={holding.holdingId} aria-pressed={selectedHolding?.holdingId === holding.holdingId} onClick={() => setSelectedHoldingId(holding.holdingId)}><span><small>{holding.issuerName}</small><strong>{holding.bondName}</strong><em>{bond?.creditRating ?? "등급 없음"} · {holding.unreadAlertCount > 0 ? `새 변화 ${holding.unreadAlertCount}` : "새 변화 없음"}</em></span>{holding.currentRiskState ? <span className={`state-tag state-${holding.currentRiskState.overall.toLowerCase()}`}>{stateLabels[holding.currentRiskState.overall]}</span> : <span className="state-missing">계산 전</span>}</button>;
                    })}
                  </aside>
                  <div className="workspace-detail">
                    {selectedHolding && selectedBond ? <>
                      <header className="bond-detail-header"><div><p>{selectedHolding.issuerName}</p><h3>{selectedHolding.bondName}</h3><div className="bond-meta"><span>{selectedBond.creditRating}</span><span>만기 {formatDate(selectedBond.maturityDate)}</span><span>표면금리 {selectedBond.couponRate.toFixed(3)}%</span></div></div><div className="bond-header-actions">{selectedHolding.currentRiskState && <span className={`state-tag state-${selectedHolding.currentRiskState.overall.toLowerCase()}`}>{stateLabels[selectedHolding.currentRiskState.overall]}</span>}<button type="button" className="secondary-button" onClick={runDemoAnalysis} disabled={analysisPending} aria-busy={analysisPending}>{analysisPending ? "화면 실행 중…" : "재분석 데모"}</button></div></header>
                      <nav className="workspace-tabs" aria-label="채권 리포트" role="tablist">{([
                        ["overview", "요약"], ["facts", "원문 사실"], ["metrics", "정량 지표"], ["insight", "AI 해석"], ["timeline", "변화 기록"],
                      ] as Array<[WorkspaceTab, string]>).map(([value, label]) => <button type="button" role="tab" aria-selected={workspaceTab === value} key={value} onClick={() => setWorkspaceTab(value)}>{label}</button>)}</nav>
                      <div className="workspace-tab-panel" role="tabpanel">
                        {workspaceTab === "overview" && <div className="workspace-overview"><div className="attention-panel"><span>{selectedHolding.unreadAlertCount > 0 ? "확인할 변화" : "현재 요약"}</span><h4>{selectedHolding.latestRiskChange ? `${categoryLabels[selectedHolding.latestRiskChange.category]} ${stateLabels[selectedHolding.latestRiskChange.previousState]} → ${stateLabels[selectedHolding.latestRiskChange.currentState]}` : "매수 이후 위험 상태 변화가 없습니다."}</h4><p>{selectedHolding.latestAlert?.message ?? "검증된 새 알림이 없습니다."}</p></div><div className="report-rail"><article data-layer="fact"><span>1</span><div><small>검증 원문</small><h4>{selectedHolding.newEventCount}건의 검증된 변화</h4><p>원문과 일치한 Event만 집계합니다.</p><button type="button" onClick={() => setWorkspaceTab("facts")}>원문 사실 보기</button></div></article><article data-layer="calc"><span>2</span><div><small>계산된 변화</small><h4>{selectedHolding.currentRiskState ? `${stateLabels[selectedHolding.currentRiskState.overall]} 상태` : "계산 전"}</h4><p>재현 가능한 정책 규칙의 결과입니다.</p><button type="button" onClick={() => setWorkspaceTab("metrics")}>정량 지표 보기</button></div></article><article data-layer="ai"><span>3</span><div><small>참고 해석</small><h4>검증 데이터만 설명</h4><p>위험 상태 결정과 투자 추천에는 사용하지 않습니다.</p><button type="button" onClick={() => setWorkspaceTab("insight")}>해석 보기</button></div></article></div></div>}
                        {workspaceTab === "facts" && <div className="workspace-facts"><p className="layer-kicker fact">검증 원문</p><h4>최근 알림과 연결된 공시 근거</h4>{selectedHolding.latestAlert?.riskEventId ? <><p>{selectedHolding.latestAlert.message}</p><Link className="primary-button" to={`/risk-events/${selectedHolding.latestAlert.riskEventId}`}>원문 근거 열기</Link></> : <div className="quiet-empty"><p>현재 목록에서 바로 연결할 원문 Event가 없습니다.</p><small>매수 이후 상세에는 날짜순 검증 기록이 표시됩니다.</small></div>}</div>}
                        {workspaceTab === "metrics" && <div className="workspace-metrics"><p className="layer-kicker calc">정량 지표</p><h4>현재 위험 범주</h4>{selectedHolding.currentRiskState ? <dl>{([['liquidity','유동성'],['cashFlow','현금흐름'],['leverage','부채 부담'],['earnings','수익성'],['credit','신용']] as const).map(([key,label]) => <div key={key}><dt>{label}</dt><dd className={`state-${selectedHolding.currentRiskState![key].toLowerCase()}`}>{stateLabels[selectedHolding.currentRiskState![key]]}</dd></div>)}</dl> : <div className="quiet-empty"><p>계산된 위험 Snapshot이 없습니다.</p></div>}<p className="metric-note">수익률·시장가격 등 mock의 시장 지표는 현재 API에 없어 후속 연동 대상으로 남겨두었습니다.</p></div>}
                        {workspaceTab === "insight" && <div className="workspace-insight"><p className="layer-kicker ai">참고 해석</p><h4>추가 질문 화면</h4><div className="truth-note"><strong>데모 기능</strong><p>실제 AI 호출이나 위험 상태 변경 없이 화면 동작만 확인합니다.</p></div>{analysisNotice && <p className="analysis-notice" role="status">{analysisNotice}</p>}<form onSubmit={askDemoQuestion} noValidate><label htmlFor="credit-question">검증된 변화에 대해 질문</label><textarea className="resize-none" id="credit-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 부채 부담이 관찰 상태가 된 계산 근거는 무엇인가요?" /><button type="submit" disabled={!question.trim()}>질문 화면 실행</button></form>{questionResult && <div className="demo-answer" role="status"><strong>데모 답변</strong><p>{questionResult}</p></div>}<Link className="text-link" to={`/holdings/${selectedHolding.holdingId}/since-bought`}>실제 매수 이후 설명 보기 →</Link></div>}
                        {workspaceTab === "timeline" && <div className="workspace-timeline"><p className="layer-kicker">변화 기록</p><h4>매수일부터 현재까지</h4><ol><li><time>{formatDate(selectedHolding.purchaseDate)}</time><span /><div><strong>채권 매수</strong><p>{formatMoney(selectedHolding.purchaseAmount)} 등록</p></div></li>{selectedHolding.latestActivityAt && <li><time>{formatDateTime(selectedHolding.latestActivityAt)}</time><span /><div><strong>최근 확인된 변화</strong><p>{selectedHolding.latestAlert?.message ?? "검증된 상태 변화"}</p></div></li>}</ol><Link className="primary-button" to={`/holdings/${selectedHolding.holdingId}/since-bought`}>전체 변화 기록 보기</Link></div>}
                      </div>
                    </> : <div className="workspace-empty-detail"><h3>표시할 보유 채권이 없습니다.</h3><p>검색 조건을 초기화하거나 아래에서 채권을 등록해 주세요.</p></div>}
                  </div>
                </div>
              </section>
            )}
            {!isPortfolioEmpty && <div className="monitoring-grid">
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
                      <button type="button" className="row-delete-button" onClick={() => setDeleteTarget({ type: "holding", id: holding.holdingId, name: holding.bondName })}>보유 목록에서 삭제</button>
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
                      <Link to={alertTarget(alert)} onClick={() => pageState !== "stale" && void handleAlertRead(alert)} aria-busy={pendingAlertId === alert.alertId}>
                        {pendingAlertId === alert.alertId ? "읽음 처리 중…" : alert.targetType === "RISK_EVENT" ? "원문 근거 보기 →" : "변화 자세히 보기 →"}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            </div>}

            {pageState !== "stale" && (
            <section id="watchlist" className="registration-section" aria-labelledby="registration-title">
              <div className="section-heading"><div><p className="section-label">포트폴리오 설정</p><h2 id="registration-title">내 목록에 등록</h2></div></div>
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
                  {watchlist.length > 0 && <ul className="watchlist-entries">{watchlist.map((entry) => <li key={entry.id}><span>{entry.bond.name}</span><button type="button" onClick={() => setDeleteTarget({ type: "watchlist", id: entry.id, name: entry.bond.name })}>삭제</button></li>)}</ul>}
                  <div className="form-message" aria-live="polite">{watchError && <p id="watch-error" role="alert">{watchError}</p>}{watchNotice && <p className="success-message">{watchNotice}</p>}</div>
                  <button type="submit" disabled={watchPending || bonds.length === 0} aria-busy={watchPending}>{watchPending ? "등록 중…" : "관심 채권 등록"}</button>
                </form>
              </div>
            </section>
            )}
          </>
        )}
      </main>
      <MobileNav />
      <Dialog open={workspaceDialog === "framework"} onClose={() => setWorkspaceDialog(null)} title="Bonda 분석 구조" eyebrow="정보의 권위를 분리"><div className="dialog-copy"><h3>검증 원문</h3><p>AI가 찾은 후보 중 원문, 금액, 날짜와 발행사 연결을 규칙으로 검증한 사실입니다.</p><h3>정량 지표</h3><p>versioned policy가 같은 입력에 같은 위험 상태를 계산합니다.</p><h3>AI 해석</h3><p>검증된 변화만 짧게 설명하며 공식 상태를 결정하지 않습니다.</p></div></Dialog>
      <Dialog open={workspaceDialog === "diagnosis"} onClose={() => setWorkspaceDialog(null)} title="새 채권 직접 진단" eyebrow="저장되지 않는 데모"><div className="truth-note"><strong>백엔드 연동 전</strong><p>직접 입력한 채권과 공시 문장은 서버에 전송되지 않습니다.</p></div><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); setWorkspaceDialog(null); setAnalysisNotice("직접 진단 입력 흐름을 체험했습니다. 분석 결과는 저장되지 않았습니다."); }} noValidate><label htmlFor="diagnosis-bond">채권명</label><input id="diagnosis-bond" placeholder="예: CJ CGV 35" /><label htmlFor="diagnosis-issuer">발행사</label><input id="diagnosis-issuer" placeholder="예: CJ CGV" /><label htmlFor="diagnosis-source">공시 문장</label><textarea className="resize-none" id="diagnosis-source" placeholder="DART 공시 문구를 붙여넣어 화면 흐름을 확인하세요." /><button type="submit" className="primary-button">진단 화면 실행</button></form></Dialog>
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deletePending && setDeleteTarget(null)} title={`${deleteTarget?.name ?? "채권"} 삭제`} eyebrow="목록에서 제거"><p className="delete-copy">{deleteTarget?.type === "holding" ? "보유 기록과 이 채권을 기준으로 한 화면 접근이 목록에서 사라집니다." : "관심 채권 목록에서 제거합니다."}</p>{deleteError && <p className="form-error" role="alert">{deleteError}</p>}<div className="dialog-actions split"><button type="button" className="secondary-button" onClick={() => setDeleteTarget(null)} disabled={deletePending}>취소</button><button type="button" className="danger-button" onClick={() => void confirmDelete()} disabled={deletePending} aria-busy={deletePending}>{deletePending ? "삭제 중…" : "삭제"}</button></div></Dialog>
      {analysisNotice && <Toast message={analysisNotice} onDismiss={() => setAnalysisNotice("")} />}
      {hasSnapshot && <footer><p>{pageState === "stale" && lastSuccessfulAt ? `${formatCheckedAt(lastSuccessfulAt)}에 확인한 검증 데이터를 보여드립니다.` : "검증된 변화만 보여드립니다."}</p></footer>}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/monitoring" element={<PortfolioPage />} />
      <Route path="/holdings/:holdingId/since-bought" element={<SinceBoughtPage />} />
      <Route path="/risk-events/:riskEventId" element={<RiskEventPage />} />
      <Route path="/admin/replay" element={<HistoricalReplayPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
