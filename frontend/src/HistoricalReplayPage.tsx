import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getBonds, runHistoricalReplay } from "./api";
import { AppHeader, MobileNav } from "./Navigation";
import type { Bond, HistoricalReplayResponse, RiskState } from "./types";

const stateLabels: Record<RiskState, string> = { NORMAL: "정상", WATCH: "관찰", CAUTION: "주의" };
const categoryLabels = {
  liquidity: "유동성",
  cashFlow: "현금흐름",
  leverage: "부채 부담",
  earnings: "수익성",
  credit: "신용",
} as const;
const timelineLabels = {
  DISCLOSURE: "공시",
  RISK_EVENT: "검증된 변화",
  FINANCIAL_SNAPSHOT: "재무",
  RISK_CHANGE: "상태 변화",
} as const;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function HistoricalReplayPage() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [issuerId, setIssuerId] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [result, setResult] = useState<HistoricalReplayResponse | null>(null);
  const [loadingIssuers, setLoadingIssuers] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const issuerRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const replayControllerRef = useRef<AbortController | null>(null);
  const issuers = useMemo(() => Array.from(new Map(
    bonds.map((bond) => [bond.issuer.id, bond.issuer]),
  ).values()), [bonds]);
  const firstDebtEventIndex = result?.timeline.findIndex((item) => item.title.includes("총차입금")) ?? -1;

  useEffect(() => {
    document.title = "과거 위험 재현 | Bonda";
    const controller = new AbortController();
    let active = true;
    getBonds(controller.signal)
      .then((items) => { if (active) setBonds(items); })
      .catch((caught: unknown) => {
        if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
        setError("발행기업 목록을 불러오지 못했습니다. 다시 방문해 주세요.");
      })
      .finally(() => { if (active) setLoadingIssuers(false); });
    return () => {
      active = false;
      controller.abort();
      const activeReplay = replayControllerRef.current;
      replayControllerRef.current = null;
      activeReplay?.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (!issuerId) {
      setError("재현할 발행기업을 선택해 주세요.");
      issuerRef.current?.focus();
      return;
    }
    if (!cutoffDate) {
      setError("기준일을 입력해 주세요.");
      dateRef.current?.focus();
      return;
    }
    if (cutoffDate > localToday()) {
      setError("기준일은 오늘 또는 이전 날짜로 입력해 주세요.");
      dateRef.current?.focus();
      return;
    }
    replayControllerRef.current?.abort();
    const controller = new AbortController();
    replayControllerRef.current = controller;
    setPending(true);
    setResult(null);
    try {
      const replay = await runHistoricalReplay(Number(issuerId), cutoffDate, controller.signal);
      if (replayControllerRef.current === controller) setResult(replay);
    } catch (caught: unknown) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("과거 상태를 재현하지 못했습니다. 입력과 연결 상태를 확인해 주세요.");
    } finally {
      if (replayControllerRef.current === controller) {
        replayControllerRef.current = null;
        setPending(false);
      }
    }
  }

  return <>
    <div className="app-shell pulse-product-page replay-shell">
      <AppHeader backLabel="내 채권으로" backTo="/monitoring" />
      <main>
        <header className="replay-intro"><h1>선택한 날짜까지 공개된 정보</h1></header>

        <form className="replay-form" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="replay-issuer">발행기업</label>
            <select ref={issuerRef} id="replay-issuer" value={issuerId} onChange={(event) => setIssuerId(event.target.value)} disabled={loadingIssuers || pending} aria-invalid={Boolean(error) && !issuerId} aria-describedby={error ? "replay-error" : undefined} required>
              <option value="">{loadingIssuers ? "불러오는 중…" : "발행기업을 선택해 주세요"}</option>
              {issuers.map((issuer) => <option key={issuer.id} value={issuer.id}>{issuer.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="replay-cutoff">기준일</label>
            <input ref={dateRef} id="replay-cutoff" type="date" max={localToday()} value={cutoffDate} onChange={(event) => setCutoffDate(event.target.value)} disabled={pending} aria-invalid={Boolean(error) && (!cutoffDate || cutoffDate > localToday())} aria-describedby={error ? "replay-error" : undefined} required />
          </div>
          <button type="submit" disabled={pending || loadingIssuers || issuers.length === 0} aria-busy={pending}>{pending ? "재현 중…" : "이 시점 재현하기"}</button>
          <div className="form-message" aria-live="polite">
            {error && <p id="replay-error" role="alert">{error}</p>}
            {!error && !loadingIssuers && issuers.length === 0 && <p>등록된 발행기업이 없어 아직 재현할 수 없습니다.</p>}
          </div>
        </form>

        {result && (
          <section className="replay-result" aria-labelledby="replay-result-title">
            <div className="replay-summary">
              <p>{result.issuer.name}</p>
              <h2 id="replay-result-title">{result.cutoffDate} 당시 상태: <strong className={`state-${result.riskSnapshot.overall.toLowerCase()}`}>{stateLabels[result.riskSnapshot.overall]}</strong></h2>
            </div>
            <div className="section-heading replay-timeline-heading"><h3>당시 공개된 사건</h3></div>
            {result.timeline.length === 0 ? (
              <div className="quiet-empty"><p>기준일까지 사용할 수 있었던 공시·재무 변화가 없습니다.</p></div>
            ) : (
              <ol className="replay-timeline">
                {result.timeline.map((item, index) => (
                  <li key={`${item.type}-${item.sourceId ?? index}-${item.date}`}>
                    <time dateTime={item.date}>{item.date}</time>
                    <div><span>{timelineLabels[item.type]}</span><h3>{index === firstDebtEventIndex ? `${item.title} (빌린 돈)` : item.title}</h3><p>{item.summary}</p></div>
                  </li>
                ))}
              </ol>
            )}
            <p className="replay-source-count">사용한 공시 {result.disclosuresUsed.length}개 · 검증된 변화 {result.riskEvents.length}개 · 재무 {result.financialSnapshot?.period ?? "없음"}</p>
            <dl className="replay-state-list">
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => (
                <div key={category}><dt>{categoryLabels[category]}</dt><dd>{stateLabels[result.riskSnapshot[category]]}</dd></div>
              ))}
            </dl>
            <p className="replay-fingerprint">재현 입력 {result.metadata.inputFingerprint.slice(0, 12)} · {result.metadata.riskRuleVersion}</p>
          </section>
        )}
      </main>
      <footer><p>검증된 변화를 보고, 판단은 직접 합니다.</p></footer>
    </div>
    <MobileNav />
  </>;
}
