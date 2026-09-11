import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import {
  ApiError,
  createHolding,
  createWatchlist,
  getBonds,
  getHoldings,
  getWatchlist,
} from "./api";
import type { Bond, Holding, WatchlistEntry } from "./types";

type PageState = "loading" | "ready" | "error";

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

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PortfolioPage() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [pageState, setPageState] = useState<PageState>("loading");
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
      const [bondList, holdingList, watchlistEntries] = await Promise.all([
        getBonds(signal),
        getHoldings(signal),
        getWatchlist(signal),
      ]);
      setBonds(bondList);
      setHoldings(holdingList);
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
      const holding = await createHolding({
        bondId: Number(holdingBondId),
        purchaseDate,
        purchaseAmount,
      });
      setHoldings((current) => [holding, ...current]);
      setPurchaseDate("");
      setPurchaseAmount("");
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
      setWatchError(
        error instanceof ApiError && error.status === 409
          ? "이미 관심 채권으로 등록되어 있습니다."
          : "관심 채권을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setWatchPending(false);
    }
  }

  const watchedBondIds = new Set(watchlist.map((entry) => entry.bond.id));
  const today = getLocalToday();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Bonda 홈">
          Bonda<span aria-hidden="true">.</span>
        </Link>
        <p>Bond + 본다</p>
      </header>

      <main>
        <section className="page-intro" aria-labelledby="page-title">
          <p className="eyebrow">MY BOND BASELINE</p>
          <h1 id="page-title">내 채권을 먼저 모아볼게요.</h1>
          <p>보유하거나 지켜볼 채권을 등록하면, 이후 새롭게 생긴 변화를 같은 기준에서 확인할 수 있습니다.</p>
        </section>

        {pageState === "loading" && (
          <section className="state-panel" aria-live="polite" aria-busy="true">
            <span className="spinner" aria-hidden="true" />
            <p>채권 정보를 불러오고 있습니다.</p>
          </section>
        )}

        {pageState === "error" && (
          <section className="state-panel error-panel" role="alert">
            <div>
              <h2>채권 정보를 불러오지 못했습니다</h2>
              <p>Backend가 실행 중인지 확인한 뒤 다시 시도해 주세요.</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => void loadPortfolio()}>
              다시 불러오기
            </button>
          </section>
        )}

        {pageState === "ready" && (
          <>
            <section className="bond-section" aria-labelledby="bond-list-title">
              <div className="section-heading">
                <div>
                  <p className="section-label">AVAILABLE BONDS</p>
                  <h2 id="bond-list-title">채권 목록</h2>
                </div>
                <p><strong>{bonds.length}</strong>개 · 데모 데이터</p>
              </div>

              {bonds.length === 0 ? (
                <div className="empty-state"><p>현재 등록된 채권이 없습니다.</p></div>
              ) : (
                <ul className="bond-list">
                  {bonds.map((bond) => {
                    const holdingCount = holdings.filter((holding) => holding.bond.id === bond.id).length;
                    const isWatched = watchedBondIds.has(bond.id);
                    return (
                      <li key={bond.id}>
                        <div className="bond-identity">
                          <p>{bond.issuer.name}</p>
                          <h3>{bond.name}</h3>
                          <span>{bond.bondCode}</span>
                        </div>
                        <dl className="bond-facts">
                          <div><dt>신용등급</dt><dd>{bond.creditRating}</dd></div>
                          <div><dt>표면금리</dt><dd>{bond.couponRate.toFixed(2)}%</dd></div>
                          <div><dt>만기</dt><dd>{formatDate(bond.maturityDate)}</dd></div>
                        </dl>
                        <p className="bond-state">
                          {holdingCount > 0 ? `보유 ${holdingCount}건` : "미보유"}
                          <span aria-hidden="true">·</span>
                          {isWatched ? "관심 등록" : "관심 미등록"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="registration-section" aria-labelledby="registration-title">
              <div className="section-heading">
                <div>
                  <p className="section-label">PORTFOLIO SETUP</p>
                  <h2 id="registration-title">내 목록에 등록</h2>
                </div>
              </div>

              <div className="form-grid">
                <form className="entry-form" onSubmit={handleHoldingSubmit} noValidate>
                  <div className="form-heading">
                    <span className="form-index">01</span>
                    <div><h3>보유 채권 등록</h3><p>실제 매수한 금액과 날짜를 기록합니다.</p></div>
                  </div>

                  <label htmlFor="holding-bond">채권</label>
                  <select
                    ref={holdingBondRef}
                    id="holding-bond"
                    value={holdingBondId}
                    onChange={(event) => setHoldingBondId(event.target.value)}
                    aria-invalid={Boolean(holdingError) && !holdingBondId}
                    aria-describedby={holdingError ? "holding-error" : undefined}
                    required
                  >
                    <option value="">채권을 선택해 주세요</option>
                    {bonds.map((bond) => <option key={bond.id} value={bond.id}>{bond.name}</option>)}
                  </select>

                  <div className="field-row">
                    <div>
                      <label htmlFor="purchase-date">매수일</label>
                      <input
                        ref={purchaseDateRef}
                        id="purchase-date"
                        type="date"
                        value={purchaseDate}
                        max={today}
                        onChange={(event) => setPurchaseDate(event.target.value)}
                        aria-invalid={Boolean(holdingError) && (!purchaseDate || purchaseDate > today)}
                        aria-describedby={holdingError ? "holding-error" : undefined}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="purchase-amount">매수금액</label>
                      <div className="amount-field">
                        <input
                          ref={purchaseAmountRef}
                          id="purchase-amount"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={purchaseAmount}
                          onChange={(event) => setPurchaseAmount(event.target.value)}
                          aria-invalid={Boolean(holdingError) && (!purchaseAmount || Number(purchaseAmount) <= 0)}
                          aria-describedby={holdingError ? "holding-error" : "amount-help"}
                          required
                        />
                        <span>원</span>
                      </div>
                      <span id="amount-help" className="field-help">
                        {purchaseAmount && Number(purchaseAmount) > 0 ? formatMoney(Number(purchaseAmount)) : "원금 기준"}
                      </span>
                    </div>
                  </div>

                  <div className="form-message" aria-live="polite">
                    {holdingError && <p id="holding-error" role="alert">{holdingError}</p>}
                    {holdingNotice && <p className="success-message">{holdingNotice}</p>}
                  </div>
                  <button type="submit" disabled={holdingPending || bonds.length === 0} aria-busy={holdingPending}>
                    {holdingPending ? "등록 중…" : "보유 채권 등록"}
                  </button>
                </form>

                <form className="entry-form" onSubmit={handleWatchSubmit} noValidate>
                  <div className="form-heading">
                    <span className="form-index">02</span>
                    <div><h3>관심 채권 등록</h3><p>매수 전에도 발행기업 변화를 지켜봅니다.</p></div>
                  </div>

                  <label htmlFor="watch-bond">채권</label>
                  <select
                    ref={watchBondRef}
                    id="watch-bond"
                    value={watchBondId}
                    onChange={(event) => setWatchBondId(event.target.value)}
                    aria-invalid={Boolean(watchError) && !watchBondId}
                    aria-describedby={watchError ? "watch-error" : undefined}
                    required
                  >
                    <option value="">채권을 선택해 주세요</option>
                    {bonds.map((bond) => (
                      <option key={bond.id} value={bond.id} disabled={watchedBondIds.has(bond.id)}>
                        {bond.name}{watchedBondIds.has(bond.id) ? " · 등록됨" : ""}
                      </option>
                    ))}
                  </select>

                  <div className="watchlist-summary">
                    <span>현재 관심 채권</span>
                    <strong>{watchlist.length}개</strong>
                  </div>
                  <div className="form-message" aria-live="polite">
                    {watchError && <p id="watch-error" role="alert">{watchError}</p>}
                    {watchNotice && <p className="success-message">{watchNotice}</p>}
                  </div>
                  <button type="submit" disabled={watchPending || bonds.length === 0} aria-busy={watchPending}>
                    {watchPending ? "등록 중…" : "관심 채권 등록"}
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>

      <footer><p>Bonda monitors change. Decisions remain yours.</p></footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
