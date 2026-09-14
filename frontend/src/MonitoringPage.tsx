import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  HelpCircle,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Dialog, Toast } from "./Dialogs";
import { AppHeader, MobileNav } from "./Navigation";
import { demoBonds, type DemoBond } from "./demo";

type MonitoringTab = "overview" | "changes" | "financials" | "sources" | "more";
type RiskState = "정상" | "관찰" | "주의";

type MonitoringRecord = DemoBond & {
  changeDate: string;
  unread: number;
  categories: Array<{ label: string; state: RiskState; note: string }>;
  financials: Array<{ label: string; baseline: number; current: number; unit: string; threshold?: number }>;
  events: Array<{ id: string; date: string; kind: string; title: string; summary: string; source: string }>;
};

const monitoringRecords: MonitoringRecord[] = [
  {
    ...demoBonds[0],
    changeDate: "2026. 05. 16.",
    unread: 2,
    categories: [
      { label: "유동성", state: "관찰", note: "순차입금 증가" },
      { label: "현금흐름", state: "정상", note: "임계값 미도달" },
      { label: "부채 부담", state: "관찰", note: "총차입금 +12.4%" },
      { label: "수익성", state: "정상", note: "최근 변화 없음" },
      { label: "신용", state: "정상", note: "등급 유지" },
    ],
    financials: [
      { label: "총차입금", baseline: 9.8, current: 11.0, unit: "조원", threshold: 10.8 },
      { label: "현금성자산", baseline: 3.1, current: 2.7, unit: "조원" },
      { label: "부채비율", baseline: 112, current: 126, unit: "%", threshold: 120 },
      { label: "영업현금흐름", baseline: 0.82, current: 0.64, unit: "조원" },
    ],
    events: [
      { id: "lotte-purchase", date: "2025. 08. 12.", kind: "기준점", title: "채권 매수", summary: "매수일을 변화 비교 기준으로 설정했습니다.", source: "보유 내역" },
      { id: "lotte-debt", date: "2026. 03. 14.", kind: "재무", title: "총차입금 증가", summary: "직전 비교기간 대비 총차입금이 12.4% 증가했습니다.", source: "2025 사업보고서 · [데모]" },
      { id: "lotte-cash", date: "2026. 05. 16.", kind: "공시", title: "순차입금 증가 확인", summary: "연결 기준 순차입금 증가가 분기보고서에서 확인되었습니다.", source: "2026 1분기보고서 · [데모]" },
    ],
  },
  {
    ...demoBonds[1],
    changeDate: "2026. 04. 28.",
    unread: 0,
    categories: ["유동성", "현금흐름", "부채 부담", "수익성", "신용"].map((label) => ({ label, state: "정상" as const, note: "임계값 미도달" })),
    financials: [
      { label: "총차입금", baseline: 8.1, current: 7.7, unit: "조원" },
      { label: "현금성자산", baseline: 5.0, current: 5.4, unit: "조원" },
      { label: "부채비율", baseline: 95, current: 91, unit: "%" },
      { label: "영업현금흐름", baseline: 2.4, current: 2.6, unit: "조원" },
    ],
    events: [
      { id: "air-purchase", date: "2025. 09. 02.", kind: "기준점", title: "채권 매수", summary: "매수일을 변화 비교 기준으로 설정했습니다.", source: "보유 내역" },
      { id: "air-review", date: "2026. 04. 28.", kind: "점검", title: "새 주의 변화 없음", summary: "최근 공개 자료에서 정책 임계값을 넘는 변화가 확인되지 않았습니다.", source: "최근 공개 공시 · [데모]" },
    ],
  },
  {
    ...demoBonds[2],
    changeDate: "2026. 06. 03.",
    unread: 3,
    categories: [
      { label: "유동성", state: "관찰", note: "현금 감소" },
      { label: "현금흐름", state: "주의", note: "임계값 초과" },
      { label: "부채 부담", state: "주의", note: "보증 증가" },
      { label: "수익성", state: "관찰", note: "영업손실" },
      { label: "신용", state: "주의", note: "전망 부정적" },
    ],
    financials: [
      { label: "총차입금", baseline: 2.1, current: 2.6, unit: "조원", threshold: 2.4 },
      { label: "현금성자산", baseline: 0.61, current: 0.42, unit: "조원", threshold: 0.5 },
      { label: "부채비율", baseline: 178, current: 214, unit: "%", threshold: 200 },
      { label: "영업현금흐름", baseline: 0.18, current: -0.06, unit: "조원", threshold: 0 },
    ],
    events: [
      { id: "cgv-purchase", date: "2025. 07. 21.", kind: "기준점", title: "채권 매수", summary: "매수일을 변화 비교 기준으로 설정했습니다.", source: "보유 내역" },
      { id: "cgv-rating", date: "2026. 05. 27.", kind: "신용", title: "등급 전망 변경", summary: "신용등급 전망이 부정적으로 변경되었습니다.", source: "신용평가 공시 · [데모]" },
      { id: "cgv-guarantee", date: "2026. 06. 03.", kind: "공시", title: "채무보증 증가", summary: "채무보증 증가가 사업보고서에서 확인되었습니다.", source: "사업보고서 · [데모]" },
    ],
  },
];

const riskStates: RiskState[] = ["정상", "관찰", "주의"];

function StateLabel({ state }: { state: RiskState }) {
  return <span className="pulse-state" data-state={state}><span aria-hidden="true" />{state}</span>;
}

function MetricBar({ baseline, current, threshold }: { baseline: number; current: number; threshold?: number }) {
  const extent = Math.max(Math.abs(baseline), Math.abs(current), Math.abs(threshold ?? 0), 0.1);
  const baselineWidth = Math.max(4, (Math.abs(baseline) / extent) * 100);
  const currentWidth = Math.max(4, (Math.abs(current) / extent) * 100);
  const exceeded = threshold !== undefined && (threshold >= 0 ? current >= threshold : current <= threshold);
  return (
    <div className="pulse-metric-bars" aria-hidden="true">
      <span className="pulse-metric-bar baseline" style={{ width: `${baselineWidth}%` }} />
      <span className={`pulse-metric-bar current${exceeded ? " exceeded" : ""}`} style={{ width: `${currentWidth}%` }} />
    </div>
  );
}

function changeRate(baseline: number, current: number) {
  if (baseline === 0) return null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

export default function MonitoringPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(monitoringRecords[0].id);
  const [tab, setTab] = useState<MonitoringTab>("overview");
  const [eventId, setEventId] = useState(monitoringRecords[0].events.at(-1)?.id ?? "");
  const [dialog, setDialog] = useState<"add" | "help" | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return monitoringRecords;
    return monitoringRecords.filter((bond) => [bond.name, bond.issuer, bond.rating, bond.state].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalized)));
  }, [query]);
  const selected = filtered.find((bond) => bond.id === selectedId) ?? filtered[0] ?? null;
  const activeEvent = selected?.events.find((event) => event.id === eventId) ?? selected?.events.at(-1) ?? null;
  const unreadTotal = monitoringRecords.reduce((total, bond) => total + bond.unread, 0);

  function selectBond(bond: MonitoringRecord) {
    setSelectedId(bond.id);
    setEventId(bond.events.at(-1)?.id ?? "");
    setTab("overview");
  }

  function submitBond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDialog(null);
    setNotice("채권 등록 흐름을 확인했습니다. 데모에서는 저장되지 않습니다.");
  }

  function handleTabKeys(event: ReactKeyboardEvent<HTMLElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=\"tab\"]"));
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  return <>
    <div className="app-shell pulse-app">
      <AppHeader status="2026. 09. 14. 기준" statusTone="normal" />

      <section className="pulse-overview" aria-labelledby="monitoring-title">
        <div className="pulse-overview-lead">
          <p><span>[데모 데이터]</span> 보유 채권 신용 모니터링</p>
          <h1 id="monitoring-title">지금도, 당신의 채권을 지켜보고 있습니다.</h1>
          <small>주요 공시와 재무 변화를 자동으로 확인합니다.</small>
        </div>
        <div className="pulse-health">
          <Activity aria-hidden="true" />
          <div><strong>{monitoringRecords.length}개 발행사</strong><span>추적 중 · 정상</span></div>
        </div>
        <div className="pulse-checked">
          <CalendarClock aria-hidden="true" />
          <div><span>마지막 확인</span><strong>2026. 09. 14. 10:24</strong><small>정상적으로 완료됐습니다.</small></div>
        </div>
        <button type="button" className="pulse-unread" onClick={() => setNotice(`읽지 않은 변화 ${unreadTotal}건을 확인했습니다.`)}>
          <Bell aria-hidden="true" />
          <span>마지막 방문 이후<strong>{unreadTotal}건</strong><small>새로 확인된 변화</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <main className="pulse-main">
        <header className="pulse-mobile-tools">
          <button type="button" aria-expanded={mobileSearchOpen} onClick={() => { setMobileSearchOpen((open) => !open); window.requestAnimationFrame(() => mobileSearchRef.current?.focus()); }} aria-label="채권 검색"><Search /></button>
          <button type="button" onClick={() => setDialog("add")} aria-label="채권 추가"><Plus /></button>
          <button type="button" onClick={() => setDialog("help")} aria-label="분석 구조 도움말"><HelpCircle /></button>
        </header>

        {mobileSearchOpen && <label className="pulse-mobile-search" htmlFor="mobile-bond-search"><Search aria-hidden="true" /><span className="sr-only">모바일 채권 검색</span><input ref={mobileSearchRef} id="mobile-bond-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="채권명, 발행사, 등급 검색" /><button type="button" onClick={() => { setQuery(""); setMobileSearchOpen(false); }} aria-label="검색 닫기"><X /></button></label>}

        <div className="pulse-mobile-picker">
          <label htmlFor="mobile-bond-picker">확인할 채권</label>
          <div><Menu aria-hidden="true" /><select id="mobile-bond-picker" value={selected?.id ?? ""} onChange={(event) => { const record = monitoringRecords.find((bond) => bond.id === event.target.value); if (record) selectBond(record); }}>{monitoringRecords.map((bond) => <option value={bond.id} key={bond.id}>{bond.name} · {bond.state} · 새 변화 {bond.unread}</option>)}</select><ChevronDown aria-hidden="true" /></div>
        </div>

        <div className="pulse-workspace">
          <aside className="pulse-bond-list" aria-label="추적 중인 채권">
            <header><div><strong>추적 중인 채권</strong><span>{filtered.length}</span></div><button type="button" onClick={() => setDialog("add")}><Plus />채권 추가</button></header>
            <label className="pulse-search" htmlFor="bond-search"><Search aria-hidden="true" /><span className="sr-only">채권 검색</span><input ref={searchRef} id="bond-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="채권명 또는 발행사" />{query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기"><X /></button>}</label>
            {filtered.length ? filtered.map((bond) => <button type="button" className="pulse-bond-row" key={bond.id} aria-pressed={selected?.id === bond.id} onClick={() => selectBond(bond)}>
              <span><strong>{bond.name}</strong>{bond.unread > 0 && <b aria-label={`읽지 않은 변화 ${bond.unread}건`}>{bond.unread}</b>}</span>
              <span><small>{bond.rating}</small><StateLabel state={bond.state} /></span>
              <time>{bond.changeDate} · {bond.events.at(-1)?.title}</time>
            </button>) : <div className="pulse-no-results"><Search /><p>검색 조건에 맞는 채권이 없습니다.</p><button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>검색 초기화</button></div>}
          </aside>

          <section className="pulse-detail" aria-live="polite">
            {selected ? <>
              <header className="pulse-identity">
                <div className="pulse-identity-name"><p>{selected.issuer}</p><h2>{selected.name}</h2><span>[데모 데이터]</span><div><strong>{selected.rating}</strong><StateLabel state={selected.state} /></div></div>
                <dl><div><dt>만기</dt><dd>{selected.maturity}</dd></div><div><dt>표면금리</dt><dd>{selected.coupon}</dd></div><div><dt>최근 확인</dt><dd>{selected.changeDate}</dd></div></dl>
                <div className="pulse-actions"><button type="button" className="pulse-primary" onClick={() => setTab("sources")}><FileText />공시 원문 보기</button><button type="button" onClick={() => setDialog("help")}><ShieldCheck />계산 기준</button><button type="button" aria-label="더보기" onClick={() => setTab("more")}><MoreHorizontal /></button></div>
              </header>

              <nav className="pulse-tabs" role="tablist" aria-label="채권 상세 구역" onKeyDown={handleTabKeys}>
                {([ ["overview", "요약"], ["changes", "변화 기록"], ["financials", "재무 지표"], ["sources", "공시 원문"], ["more", "더보기"] ] as Array<[MonitoringTab, string]>).map(([value, label]) => <button type="button" role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)}>{label}</button>)}
              </nav>

              <div className="pulse-panel" role="tabpanel">
                {(tab === "overview" || tab === "changes") && <section className="pulse-timeline" aria-labelledby="credit-pulse-title">
                  <div className="pulse-section-heading"><div><h3 id="credit-pulse-title">Credit Pulse</h3><p>매수 후 변화 기록</p></div><span>마지막 방문 이후 <strong>{selected.unread}건</strong></span></div>
                  <div className="pulse-timeline-layout">
                    <ol>
                      {selected.events.map((event, index) => <li key={event.id} data-active={activeEvent?.id === event.id}><button type="button" onClick={() => setEventId(event.id)} aria-pressed={activeEvent?.id === event.id}><time>{event.date}</time><span className="pulse-node" aria-hidden="true" /><small>{event.kind}</small><strong>{event.title}</strong></button>{index < selected.events.length - 1 && <span className="pulse-connector" aria-hidden="true" />}</li>)}
                    </ol>
                    {activeEvent && <article className="pulse-event-detail" key={activeEvent.id}><p>{activeEvent.date} · {activeEvent.kind}</p><h4>{activeEvent.title}</h4><span>{activeEvent.summary}</span><small>{activeEvent.source}</small><button type="button" onClick={() => setTab("sources")}>공시 원문 보기<ArrowRight /></button></article>}
                  </div>
                </section>}

                {(tab === "overview" || tab === "financials") && <div className="pulse-analysis-grid">
                  <section className="pulse-risk-panel" aria-labelledby="risk-map-title">
                    <div className="pulse-section-heading"><div><h3 id="risk-map-title">현재 위험 상태</h3><p>5개 범주의 현재 신호</p></div><StateLabel state={selected.state} /></div>
                    <div className="pulse-risk-map" role="table" aria-label="위험 범주별 현재 상태">
                      <div className="pulse-risk-head" role="row"><span role="columnheader">범주</span>{riskStates.map((state) => <span role="columnheader" key={state}>{state}</span>)}<span role="columnheader">최근 변화</span></div>
                      {selected.categories.map((category) => <div role="row" key={category.label}><strong role="rowheader">{category.label}</strong>{riskStates.map((state) => <span role="cell" className="pulse-risk-cell" data-active={category.state === state} data-state={state} key={state}><span className="sr-only">{category.state === state ? `현재 ${state}` : state}</span></span>)}<span role="cell">{category.note}</span></div>)}
                    </div>
                  </section>

                  <section className="pulse-financial-panel" aria-labelledby="financial-movers-title">
                    <div className="pulse-section-heading"><div><h3 id="financial-movers-title">재무 변화</h3><p>매수 기준점 대비 현재</p></div><div className="pulse-chart-legend"><span>기준</span><span>현재</span></div></div>
                    <div className="pulse-financial-rows">
                      {selected.financials.map((metric) => {
                        const rate = changeRate(metric.baseline, metric.current);
                        return <div className="pulse-financial-row" key={metric.label}><div><strong>{metric.label}</strong><span>{metric.baseline} → <b>{metric.current}</b> {metric.unit}</span></div><MetricBar baseline={metric.baseline} current={metric.current} threshold={metric.threshold} /><em data-direction={(rate ?? 0) >= 0 ? "up" : "down"}>{rate === null ? "비교 불가" : `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}%`}</em></div>;
                      })}
                    </div>
                    <button type="button" className="pulse-text-action" onClick={() => setDialog("help")}>계산 기준 보기<ArrowRight /></button>
                  </section>
                </div>}

                {(tab === "overview" || tab === "changes") && <section className="pulse-activity" aria-labelledby="activity-title">
                  <div className="pulse-section-heading"><div><h3 id="activity-title">최근 확인 활동</h3><p>자동으로 확인한 주요 변화</p></div><button type="button" onClick={() => setTab("sources")}>전체 보기<ArrowRight /></button></div>
                  <div className="pulse-activity-table" role="table">
                    <div role="row"><span role="columnheader">확인일</span><span role="columnheader">구분</span><span role="columnheader">주요 내용</span><span role="columnheader">출처</span></div>
                    {selected.events.slice().reverse().map((event) => <button type="button" role="row" key={event.id} onClick={() => { setEventId(event.id); setTab("sources"); }}><time role="cell">{event.date}</time><span role="cell">{event.kind}</span><strong role="cell">{event.title}</strong><span role="cell">{event.source}</span></button>)}
                  </div>
                </section>}

                {tab === "sources" && <section className="pulse-sources" aria-labelledby="sources-title"><div className="pulse-section-heading"><div><h3 id="sources-title">최근 확인된 변화</h3><p>공시 원문과 확인 내용을 함께 봅니다.</p></div><span>{selected.events.length - 1}건</span></div><div className="pulse-source-list">{selected.events.slice(1).reverse().map((event) => <article key={event.id}><time>{event.date}</time><div><strong>{event.title}</strong><p>{event.summary}</p><small>{event.source}</small></div><button type="button" onClick={() => setNotice("데모에서는 실제 DART 원문으로 이동하지 않습니다.")}>공시 원문 보기<ArrowRight /></button></article>)}</div></section>}

                {tab === "more" && <section className="pulse-method"><h3>분석 범위와 변화 요약</h3><div><span>데이터 범위</span><strong>보유 내역 · 확인된 사건 · 재무 정보</strong></div><div><span>상태 결정</span><strong>정해진 RISK_POLICY_V1 계산 규칙</strong></div><div><span>최근 확인</span><strong>{selected.changeDate}</strong></div><details><summary>변화 요약 <small>AI 생성 참고 정보</small></summary><p>{selected.interpretation}</p><span>확인된 사건과 계산 결과만 사용한 데모 설명입니다. 투자 추천이나 부도 예측이 아닙니다.</span></details></section>}
              </div>
            </> : <div className="pulse-empty"><Search /><h2>채권을 찾을 수 없습니다.</h2><p>검색을 초기화하면 추적 중인 채권을 다시 볼 수 있습니다.</p><button type="button" onClick={() => setQuery("")}>검색 초기화</button></div>}
          </section>
        </div>
      </main>
    </div>

    <MobileNav />
    <Dialog open={dialog === "help"} onClose={() => setDialog(null)} title="Bonda 계산 기준" eyebrow="사실과 해석의 책임 분리"><div className="dialog-copy"><h3>확인된 사건 → 계산 → 변화 요약</h3><p>공식 위험 상태는 확인된 사건과 정해진 규칙으로만 결정됩니다. AI 설명은 사실을 추가하거나 상태를 바꾸지 않습니다.</p></div></Dialog>
    <Dialog open={dialog === "add"} onClose={() => setDialog(null)} title="보유 채권 추가" eyebrow="저장되지 않는 데모"><form className="dialog-form" onSubmit={submitBond} noValidate><label htmlFor="bond-name">채권명</label><input id="bond-name" required placeholder="예: 롯데케미칼 59-1" /><label htmlFor="purchase-date">매수일</label><input id="purchase-date" type="date" required /><label htmlFor="portfolio-kind">등록 위치</label><select id="portfolio-kind" defaultValue="holding"><option value="holding">보유 채권</option><option value="watchlist">관심 채권</option></select><button type="submit" className="primary-button">등록 흐름 확인</button></form></Dialog>
    {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
  </>;
}
