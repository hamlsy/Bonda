import { FormEvent, useMemo, useRef, useState } from "react";
import { Dialog, Toast } from "./Dialogs";
import { demoBonds } from "./demo";

type DemoTab = "overview" | "facts" | "metrics" | "insight" | "timeline";

export default function DemoMonitoring() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(demoBonds[0].id);
  const [tab, setTab] = useState<DemoTab>("overview");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [dialog, setDialog] = useState<"diagnosis" | "framework" | null>(null);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => demoBonds.filter((bond) => [bond.name, bond.issuer, bond.rating].some((value) => value.toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR")))), [query]);
  const selected = filtered.find((bond) => bond.id === selectedId) ?? filtered[0] ?? null;

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer("예시 답변: 이 화면은 질문·응답 UX만 구현되어 있습니다. 실제 연동에서는 검증된 원문과 deterministic 계산만 입력으로 사용합니다.");
  }

  return <>
    <section className="credit-workspace demo-workspace" aria-labelledby="demo-workspace-title">
      <div className="demo-mode-banner"><strong>데모 작업공간</strong><span>백엔드에 연결되지 않아 예시 데이터를 표시합니다. 어떤 값도 저장되지 않습니다.</span></div>
      <header className="workspace-toolbar"><div><p className="context-label"><span />신용 변화 작업공간</p><h2 id="demo-workspace-title">채권 리포트 데모</h2></div><div className="workspace-tools"><label className="workspace-search" htmlFor="demo-workspace-search"><span className="sr-only">예시 채권 검색</span><input ref={searchRef} id="demo-workspace-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="채권명, 발행사, 등급 검색" />{query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기">×</button>}</label><button type="button" className="secondary-button" onClick={() => setDialog("diagnosis")}>새 채권 진단</button><button type="button" className="icon-button" onClick={() => setDialog("framework")} aria-label="분석 구조 설명">?</button></div></header>
      <div className="workspace-filter" aria-label="데모 채권 필터"><button type="button" aria-pressed="true" onClick={() => setQuery("")}>전체</button><button type="button" onClick={() => setQuery("부정적")}>변화 있음</button><button type="button" onClick={() => setQuery("AA")}>투자등급</button><button type="button" onClick={() => setQuery("")}>1년 이내 만기</button></div>
      <div className="workspace-frame"><aside className="workspace-sidebar" aria-label="예시 채권 선택"><div className="workspace-sidebar-heading"><strong>예시 채권</strong><span>{filtered.length}건</span></div>{filtered.length === 0 ? <div className="workspace-no-results"><p>검색 조건에 맞는 채권이 없습니다.</p><button type="button" onClick={() => setQuery("")}>검색 초기화</button></div> : filtered.map((bond) => <button type="button" className="workspace-bond" key={bond.id} aria-pressed={selected?.id === bond.id} onClick={() => setSelectedId(bond.id)}><span><small>{bond.issuer}</small><strong>{bond.name}</strong><em>{bond.rating}</em></span><span className={`state-text state-${bond.state}`}>{bond.state}</span></button>)}</aside>
        <div className="workspace-detail">{selected ? <><header className="bond-detail-header"><div><p>{selected.issuer}</p><h3>{selected.name}</h3><div className="bond-meta"><span>{selected.rating}</span><span>만기 {selected.maturity}</span><span>표면금리 {selected.coupon}</span></div></div><div className="bond-header-actions"><span className={`state-tag state-${selected.state}`}>{selected.state}</span><button type="button" className="secondary-button" onClick={() => { setNotice("재분석 화면을 체험했습니다. 실제 분석이나 저장은 발생하지 않았습니다."); setTab("insight"); }}>재분석 데모</button></div></header>
          <nav className="workspace-tabs" role="tablist" aria-label="데모 리포트">{([['overview','요약'],['facts','원문 사실'],['metrics','정량 지표'],['insight','AI 해석'],['timeline','변화 기록']] as Array<[DemoTab,string]>).map(([value,label]) => <button type="button" role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)}>{label}</button>)}</nav>
          <div className="workspace-tab-panel" role="tabpanel">
            {tab === "overview" && <div><div className="attention-panel"><span>현재 예시 상태</span><h4>{selected.state === "정상" ? "새롭게 확인된 주의 변화가 없습니다." : `${selected.state}할 변화가 있습니다.`}</h4><p>{selected.fact}</p></div><div className="report-rail"><article data-layer="fact"><span>1</span><div><small>검증 원문</small><h4>{selected.fact}</h4><button type="button" onClick={() => setTab("facts")}>원문 사실 보기</button></div></article><article data-layer="calc"><span>2</span><div><small>계산된 변화</small><h4>{selected.calculation}</h4><button type="button" onClick={() => setTab("metrics")}>정량 지표 보기</button></div></article><article data-layer="ai"><span>3</span><div><small>참고 해석</small><h4>{selected.interpretation}</h4><button type="button" onClick={() => setTab("insight")}>해석 보기</button></div></article></div></div>}
            {tab === "facts" && <div className="workspace-facts"><p className="layer-kicker fact">검증 원문 예시</p><h4>{selected.fact}</h4><blockquote className="source-quote">“{selected.fact}”</blockquote><p>{selected.source}</p></div>}
            {tab === "metrics" && <div className="workspace-metrics"><p className="layer-kicker calc">정량 지표 예시</p><h4>{selected.calculation}</h4><dl><div><dt>유동성</dt><dd>{selected.state}</dd></div><div><dt>현금흐름</dt><dd>정상</dd></div><div><dt>부채 부담</dt><dd>{selected.state}</dd></div><div><dt>수익성</dt><dd>관찰</dd></div><div><dt>신용</dt><dd>{selected.state}</dd></div></dl><p className="metric-note">시장가격과 수익률은 데이터 API 연동 후 실제 값으로 교체합니다.</p></div>}
            {tab === "insight" && <div className="workspace-insight"><p className="layer-kicker ai">참고 해석 예시</p><h4>{selected.interpretation}</h4><div className="truth-note"><strong>AI 호출 없는 데모</strong><p>질문 인터페이스와 결과 상태만 동작합니다.</p></div><form onSubmit={ask} noValidate><label htmlFor="demo-credit-question">추가 질문</label><textarea className="resize-none" id="demo-credit-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 이 변화가 관찰 상태가 된 이유는?" /><button type="submit" disabled={!question.trim()}>질문 화면 실행</button></form>{answer && <div className="demo-answer" role="status"><strong>데모 답변</strong><p>{answer}</p></div>}</div>}
            {tab === "timeline" && <div className="workspace-timeline"><p className="layer-kicker">변화 기록 예시</p><h4>매수일부터 현재까지</h4><ol><li><time>2025. 08. 12.</time><span /><div><strong>채권 매수</strong><p>모니터링 기준점이 시작되었습니다.</p></div></li><li><time>2026. 05. 16.</time><span /><div><strong>최근 변화</strong><p>{selected.fact}</p></div></li></ol></div>}
          </div></> : <div className="workspace-empty-detail"><h3>검색 결과가 없습니다.</h3><p>검색어를 지우고 다시 확인해 주세요.</p></div>}</div>
      </div>
    </section>
    <Dialog open={dialog === "framework"} onClose={() => setDialog(null)} title="Bonda 분석 구조" eyebrow="데모 설명"><div className="dialog-copy"><h3>원문 → 계산 → 해석</h3><p>각 단계는 서로 다른 출처와 책임을 가지며, AI 해석은 공식 위험 상태를 변경하지 않습니다.</p></div></Dialog>
    <Dialog open={dialog === "diagnosis"} onClose={() => setDialog(null)} title="새 채권 직접 진단" eyebrow="저장되지 않는 데모"><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); setDialog(null); setNotice("직접 진단 입력 흐름을 체험했습니다. 데이터는 저장되지 않았습니다."); }} noValidate><label htmlFor="demo-diagnosis-name">채권명</label><input id="demo-diagnosis-name" placeholder="예: CJ CGV 35" /><label htmlFor="demo-diagnosis-source">공시 문장</label><textarea className="resize-none" id="demo-diagnosis-source" placeholder="공시 문장을 입력해 화면 흐름을 확인하세요." /><button type="submit" className="primary-button">진단 화면 실행</button></form></Dialog>
    {notice && <Toast message={notice} onDismiss={() => setNotice("")} />}
  </>;
}
