import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  FileText,
  HelpCircle,
  Menu,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Dialog, Toast } from "./Dialogs";
import { AppHeader, MobileNav } from "./Navigation";
import { demoBonds, type DemoBond } from "./demo";

type MonitoringTab = "overview" | "changes" | "evidence" | "more";
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

function StateLabel({ state }: { state: RiskState }) {
  return <span className="evidence-state" data-state={state}><span aria-hidden="true" />{state}</span>;
}

function MetricBar({ baseline, current, threshold }: { baseline: number; current: number; threshold?: number }) {
  const extent = Math.max(Math.abs(baseline), Math.abs(current), Math.abs(threshold ?? 0), 0.1);
  const baselineWidth = Math.max(3, (Math.abs(baseline) / extent) * 100);
  const currentWidth = Math.max(3, (Math.abs(current) / extent) * 100);
  const exceeded = threshold !== undefined && (threshold >= 0 ? current >= threshold : current <= threshold);
  return (
    <div className="metric-bars" aria-hidden="true">
      <span className="metric-bar baseline" style={{ width: `${baselineWidth}%` }} />
      <span className={`metric-bar current${exceeded ? " exceeded" : ""}`} style={{ width: `${currentWidth}%` }} />
    </div>
  );
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
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  return (
    <div className="app-shell evidence-app">
      <AppHeader status="2026. 09. 14. 기준" statusTone="normal" />
      <main className="evidence-main">
        <header className="evidence-toolbar">
          <div>
            <p className="evidence-context">보유 채권 신용 모니터링 <span>[데모 데이터]</span></p>
            <h1>변화와 근거를 한 화면에서 확인하세요</h1>
          </div>
          <div className="evidence-tools">
            <label className="evidence-search" htmlFor="bond-search">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">채권 검색</span>
              <input ref={searchRef} id="bond-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="채권명, 발행사, 등급 검색" />
              {query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기"><X size={17} /></button>}
            </label>
            <button type="button" className="evidence-icon-button mobile-only" aria-expanded={mobileSearchOpen} onClick={() => { setMobileSearchOpen((open) => !open); window.requestAnimationFrame(() => mobileSearchRef.current?.focus()); }} aria-label="채권 검색"><Search size={19} /></button>
            <button type="button" className="evidence-secondary desktop-only" onClick={() => setDialog("add")}><Plus size={17} />채권 추가</button>
            <button type="button" className="evidence-icon-button mobile-only" onClick={() => setDialog("add")} aria-label="채권 추가"><Plus size={20} /></button>
            <button type="button" className="evidence-icon-button" onClick={() => setDialog("help")} aria-label="분석 구조 도움말"><HelpCircle size={19} /></button>
          </div>
        </header>

        {mobileSearchOpen && <label className="mobile-search-panel" htmlFor="mobile-bond-search"><Search aria-hidden="true" size={18} /><span className="sr-only">모바일 채권 검색</span><input ref={mobileSearchRef} id="mobile-bond-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="채권명, 발행사, 등급 검색" /><button type="button" onClick={() => { setQuery(""); setMobileSearchOpen(false); }} aria-label="검색 닫기"><X size={18} /></button></label>}

        <div className="evidence-mobile-picker">
          <label htmlFor="mobile-bond-picker">확인할 채권</label>
          <div><Menu aria-hidden="true" size={18} /><select id="mobile-bond-picker" value={selected?.id ?? ""} onChange={(event) => { const record = monitoringRecords.find((bond) => bond.id === event.target.value); if (record) selectBond(record); }}>{monitoringRecords.map((bond) => <option value={bond.id} key={bond.id}>{bond.name} · {bond.state}</option>)}</select><ChevronDown aria-hidden="true" size={18} /></div>
        </div>

        <div className="evidence-workspace">
          <aside className="evidence-bond-list" aria-label="보유 채권 목록">
            <header><strong>보유 채권</strong><span>{filtered.length}건</span></header>
            {filtered.length ? filtered.map((bond) => (
              <button type="button" key={bond.id} aria-pressed={selected?.id === bond.id} onClick={() => selectBond(bond)}>
                <span className="bond-list-head"><strong>{bond.name}</strong>{bond.unread > 0 && <span aria-label={`읽지 않은 알림 ${bond.unread}건`}>{bond.unread}</span>}</span>
                <span className="bond-list-meta"><span>{bond.rating}</span><StateLabel state={bond.state} /></span>
                <span className="bond-list-change">{bond.changeDate} · {bond.events.at(-1)?.title}</span>
              </button>
            )) : <div className="evidence-no-results"><Search size={20} /><p>검색 조건에 맞는 채권이 없습니다.</p><button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>검색 초기화</button></div>}
          </aside>

          <section className="evidence-detail" aria-live="polite">
            {selected ? <>
              <header className="evidence-identity">
                <div>
                  <p>{selected.issuer}</p>
                  <h2>{selected.name}</h2>
                  <dl><div><dt>등급</dt><dd>{selected.rating}</dd></div><div><dt>만기</dt><dd>{selected.maturity}</dd></div><div><dt>표면금리</dt><dd>{selected.coupon}</dd></div><div><dt>최근 확인</dt><dd>{selected.changeDate}</dd></div></dl>
                </div>
                <div className="identity-actions"><StateLabel state={selected.state} /><button type="button" className="evidence-icon-button" aria-label="데이터 다시 확인" onClick={() => setNotice("최신 데모 기준일을 다시 확인했습니다.")}><RefreshCw size={18} /></button><button type="button" className="evidence-icon-button" aria-label="알림 설정"><Bell size={18} /></button></div>
              </header>

              <nav className="evidence-tabs" role="tablist" aria-label="채권 상세 구역" onKeyDown={handleTabKeys}>
                {([["overview", "요약"], ["changes", "변화"], ["evidence", "근거"], ["more", "더보기"]] as Array<[MonitoringTab, string]>).map(([value, label]) => <button type="button" role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)}>{label}</button>)}
              </nav>

              <div className="evidence-panel" role="tabpanel">
                {(tab === "overview" || tab === "changes") && <>
                  <section className="event-section" aria-labelledby="event-rail-title">
                    <div className="evidence-section-heading"><div><p>매수일 이후</p><h3 id="event-rail-title">근거 연결형 사건 연대기</h3></div><span>사건 {selected.events.length - 1}건</span></div>
                    <ol className="event-rail">
                      {selected.events.map((event, index) => <li key={event.id} data-active={activeEvent?.id === event.id}><button type="button" onClick={() => setEventId(event.id)} aria-pressed={activeEvent?.id === event.id}><time>{event.date}</time><span className="event-marker" aria-hidden="true" /><small>{event.kind}</small><strong>{event.title}</strong></button>{index < selected.events.length - 1 && <span className="event-connector" aria-hidden="true" />}</li>)}
                    </ol>
                    {activeEvent && <div className="event-explanation" key={activeEvent.id}><FileText aria-hidden="true" size={19} /><div><p>{activeEvent.summary}</p><span>{activeEvent.source}</span></div><button type="button" onClick={() => setTab("evidence")}>근거 행 보기</button></div>}
                  </section>

                  <div className="evidence-analysis-grid">
                    <section className="risk-matrix" aria-labelledby="risk-matrix-title">
                      <div className="evidence-section-heading"><div><p>RISK_POLICY_V1</p><h3 id="risk-matrix-title">현재 위험 상태</h3></div><StateLabel state={selected.state} /></div>
                      <div className="risk-matrix-table" role="table" aria-label="위험 범주별 현재 상태">
                        {selected.categories.map((category) => <div role="row" key={category.label}><strong role="rowheader">{category.label}</strong><StateLabel state={category.state} /><span role="cell">{category.note}</span></div>)}
                      </div>
                    </section>

                    <section className="financial-chart" aria-labelledby="financial-chart-title">
                      <div className="evidence-section-heading"><div><p>매수 기준점 대비</p><h3 id="financial-chart-title">재무 변화</h3></div><div className="chart-legend"><span>기준</span><span>현재</span></div></div>
                      <div className="financial-rows">
                        {selected.financials.map((metric) => <div className="financial-row" key={metric.label}><div><strong>{metric.label}</strong><span>{metric.baseline} → <b>{metric.current}</b> {metric.unit}</span></div><MetricBar baseline={metric.baseline} current={metric.current} threshold={metric.threshold} /></div>)}
                      </div>
                      <p className="chart-summary">회계 기준점과 최신 공개 재무 snapshot의 deterministic 비교입니다. 색상 표시만으로 상태를 판단하지 마세요.</p>
                    </section>
                  </div>
                </>}

                {(tab === "overview" || tab === "evidence") && <section className="evidence-table-section" aria-labelledby="evidence-table-title">
                  <div className="evidence-section-heading"><div><p>검증된 공개 자료</p><h3 id="evidence-table-title">최근 변화와 원문 근거</h3></div><span>{selected.events.length - 1}건</span></div>
                  <div className="evidence-data-table" role="table">
                    <div role="row" className="evidence-table-head"><span role="columnheader">공개일</span><span role="columnheader">변화</span><span role="columnheader">계산·원문</span><span role="columnheader">상태</span></div>
                    {selected.events.slice(1).reverse().map((event) => <button type="button" role="row" key={event.id} data-active={activeEvent?.id === event.id} onClick={() => setEventId(event.id)}><time role="cell">{event.date}</time><strong role="cell">{event.title}</strong><span role="cell"><span>{event.summary}</span><small>{event.source}</small></span><span role="cell">검증됨</span></button>)}
                  </div>
                </section>}

                {tab === "more" && <section className="more-section"><h3>분석 범위와 참고 해석</h3><div className="method-grid"><div><span>데이터 범위</span><strong>보유 내역 · 검증 사건 · 재무 snapshot</strong></div><div><span>상태 결정</span><strong>RISK_POLICY_V1 deterministic logic</strong></div><div><span>최근 확인</span><strong>{selected.changeDate}</strong></div></div></section>}

                <details className="ai-reference" open={tab === "more"}>
                  <summary><span>AI 참고 해석</span><small>공식 위험 상태를 변경하지 않습니다.</small></summary>
                  <div><p>{selected.interpretation}</p><span>검증 사건과 계산 결과만 입력한 데모 설명입니다. 투자 추천이나 부도 예측이 아닙니다.</span></div>
                </details>
              </div>
            </> : <div className="evidence-empty-detail"><h2>채권을 선택할 수 없습니다.</h2><p>검색을 초기화한 뒤 다시 확인해 주세요.</p></div>}
          </section>
        </div>
      </main>

      <MobileNav />
      <Dialog open={dialog === "help"} onClose={() => setDialog(null)} title="Bonda 분석 구조" eyebrow="사실과 해석의 책임 분리"><div className="dialog-copy"><h3>검증 사건 → 계산 → 참고 해석</h3><p>공식 위험 상태는 검증된 사건과 deterministic 규칙으로만 결정됩니다. AI 설명은 사실을 추가하거나 상태를 바꾸지 않습니다.</p></div></Dialog>
      <Dialog open={dialog === "add"} onClose={() => setDialog(null)} title="보유 채권 추가" eyebrow="저장되지 않는 데모"><form className="dialog-form" onSubmit={submitBond} noValidate><label htmlFor="bond-name">채권명</label><input id="bond-name" required placeholder="예: 롯데케미칼 59-1" /><label htmlFor="purchase-date">매수일</label><input id="purchase-date" type="date" required /><label htmlFor="portfolio-kind">등록 위치</label><select id="portfolio-kind" defaultValue="holding"><option value="holding">보유 채권</option><option value="watchlist">관심 채권</option></select><button type="submit" className="primary-button">등록 흐름 확인</button></form></Dialog>
      {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
    </div>
  );
}
