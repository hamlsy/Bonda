import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, KakaoDemo, LoginDemo, PricingDemo, RoadmapDialog, Toast } from "./Dialogs";
import { demoBonds } from "./demo";

type Modal = "principles" | "pricing" | "login" | "roadmap" | "kakao" | "register" | "terms" | "source" | null;

export default function LandingPage() {
  const [activeBondId, setActiveBondId] = useState(demoBonds[0].id);
  const [modal, setModal] = useState<Modal>(null);
  const [demoUser, setDemoUser] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [quickQuery, setQuickQuery] = useState("");
  const [registerDate, setRegisterDate] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const activeBond = useMemo(() => demoBonds.find((bond) => bond.id === activeBondId) ?? demoBonds[0], [activeBondId]);

  useEffect(() => { document.title = "Bonda | 회사채 신용 변화 모니터링"; }, []);

  function demoLogin(name: string) {
    setDemoUser(name);
    setModal(null);
    setToast(`${name} 로그인 화면을 체험했습니다. 계정은 저장되지 않습니다.`);
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickQuery.trim() || !registerDate) return;
    setModal(null);
    setToast(`${quickQuery.trim()} 등록 흐름을 체험했습니다. 실제 저장은 모니터링 화면에서 진행해 주세요.`);
  }

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <Link className="wordmark" to="/" aria-label="Bonda 홈"><span aria-hidden="true">B</span>Bonda</Link>
        <nav aria-label="소개 메뉴"><a href="#preview">리포트 체험</a><a href="#principles">작동 방식</a><button type="button" onClick={() => setModal("pricing")}>요금제</button></nav>
        <div className="landing-header-actions">
          {demoUser ? <button type="button" className="user-chip" onClick={() => { setDemoUser(null); setToast("데모 로그인 상태를 종료했습니다."); }}>{demoUser} · 종료</button> : <button type="button" className="text-button" onClick={() => setModal("login")}>로그인</button>}
          <Link className="primary-button" to="/monitoring">내 채권 보기</Link>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="hero-copy">
            <p className="context-label"><span />개인 회사채 모니터링</p>
            <h1 id="landing-title">내가 산 뒤,<br /><em>무엇이 달라졌는지</em> 봅니다.</h1>
            <p>공시 원문, 재현 가능한 계산, 제한적인 AI 해석을 분리해 보여드립니다. 투자 판단보다 먼저 확인할 사실을 놓치지 마세요.</p>
            <div className="hero-actions"><Link className="primary-button" to="/monitoring">모니터링 열기 <span aria-hidden="true">→</span></Link><a className="secondary-button" href="#preview">예시 리포트 보기</a></div>
            <dl className="hero-proof"><div><dt>판정 방식</dt><dd>규칙 기반</dd></div><div><dt>근거</dt><dd>DART 원문</dd></div><div><dt>AI 역할</dt><dd>참고 설명</dd></div></dl>
          </div>
          <div className="hero-report" aria-label="Bonda 리포트 구조 예시">
            <div className="report-top"><div><small>{activeBond.issuer}</small><strong>{activeBond.name}</strong></div><span className={`state-tag state-${activeBond.state}`}>{activeBond.state}</span></div>
            <div className="report-rail compact"><article data-layer="fact"><span>1</span><div><small>검증 원문</small><p>{activeBond.fact}</p></div></article><article data-layer="calc"><span>2</span><div><small>계산된 변화</small><p>{activeBond.calculation}</p></div></article><article data-layer="ai"><span>3</span><div><small>참고 해석</small><p>{activeBond.interpretation}</p></div></article></div>
            <p className="demo-label">예시 데이터 · 실제 투자 판단 자료가 아닙니다.</p>
          </div>
        </section>

        <section id="preview" className="preview-section" aria-labelledby="preview-title">
          <div className="section-intro"><p className="context-label"><span />직접 눌러보는 예시</p><h2 id="preview-title">한 리포트 안에서도 정보의 권위는 다릅니다.</h2><p>채권을 선택해 원문, 계산, 해석이 어떻게 이어지는지 확인하세요.</p></div>
          <div className="preview-workspace">
            <aside className="demo-bond-list" aria-label="예시 채권"><h3>예시 채권</h3>{demoBonds.map((bond) => <button type="button" key={bond.id} aria-pressed={bond.id === activeBond.id} onClick={() => setActiveBondId(bond.id)}><span><small>{bond.issuer}</small><strong>{bond.name}</strong></span><span className={`state-text state-${bond.state}`}>{bond.state}</span></button>)}</aside>
            <div className="demo-detail">
              <header><div><p>{activeBond.issuer}</p><h3>{activeBond.name}</h3><small>{activeBond.rating} · 만기 {activeBond.maturity} · 표면금리 {activeBond.coupon}</small></div><button type="button" className="secondary-button" onClick={() => setModal("kakao")}>알림 예시</button></header>
              <div className="report-rail"><article data-layer="fact"><span>1</span><div><small>검증 원문</small><h4>{activeBond.fact}</h4><p>{activeBond.source}</p><button type="button" onClick={() => setModal("source")}>원문 구간 보기</button></div></article><article data-layer="calc"><span>2</span><div><small>계산된 변화</small><h4>{activeBond.calculation}</h4><p>같은 입력에는 같은 결과를 내는 정책 계산 예시입니다.</p></div></article><article data-layer="ai"><span>3</span><div><small>참고 해석</small><h4>{activeBond.interpretation}</h4><p>위험 상태 결정에는 사용하지 않습니다.</p></div></article></div>
            </div>
          </div>
        </section>

        <section id="principles" className="principles-section" aria-labelledby="principles-title">
          <div className="section-intro"><p className="context-label"><span />Bonda의 기준</p><h2 id="principles-title">AI보다 먼저 확인할 세 가지</h2></div>
          <ol><li><span>원문</span><h3>사실은 출처로 돌아갑니다.</h3><p>검증 과정에서 실제로 일치한 공시 구간을 함께 보여줍니다.</p></li><li><span>계산</span><h3>숫자는 같은 규칙으로 계산합니다.</h3><p>위험 상태와 변화는 version이 있는 deterministic policy가 정합니다.</p></li><li><span>해석</span><h3>AI는 설명만 보탭니다.</h3><p>검증된 데이터 밖의 인과나 투자 추천을 만들지 않습니다.</p></li></ol>
          <button type="button" className="text-link" onClick={() => setModal("principles")}>판정 구조 자세히 보기 →</button>
        </section>

        <section className="process-section" aria-labelledby="process-title">
          <div className="section-intro"><p className="context-label"><span />사용 과정</p><h2 id="process-title">등록하고, 기다리고, 근거를 확인합니다.</h2></div>
          <ol><li><span>1</span><div><h3>보유 채권 등록</h3><p>채권, 매수일, 매수금액을 기록합니다.</p></div></li><li><span>2</span><div><h3>새 공시와 변화 확인</h3><p>검증된 Event와 정책 계산이 내 채권에 연결됩니다.</p></div></li><li><span>3</span><div><h3>매수 이후 기록 읽기</h3><p>날짜순 변화와 원문 근거를 한 화면에서 확인합니다.</p></div></li></ol>
        </section>

        <section className="comparison-section" aria-labelledby="comparison-title">
          <div className="section-intro"><p className="context-label"><span />정보를 다루는 방식</p><h2 id="comparison-title">요약만 남기지 않고 검증 경로를 남깁니다.</h2></div>
          <div className="comparison-table" role="table" aria-label="일반 요약과 Bonda 비교"><div role="row"><span role="columnheader">확인 항목</span><span role="columnheader">일반 요약</span><span role="columnheader">Bonda</span></div><div role="row"><span role="rowheader">공시 근거</span><span>요약문 중심</span><strong>일치한 원문 구간</strong></div><div role="row"><span role="rowheader">위험 상태</span><span>설명과 혼재</span><strong>versioned rule 계산</strong></div><div role="row"><span role="rowheader">AI 역할</span><span>결론처럼 노출</span><strong>참고 설명으로 제한</strong></div></div>
        </section>

        <section className="quickstart-section" aria-labelledby="quickstart-title">
          <div><p className="context-label light"><span />첫 채권 등록</p><h2 id="quickstart-title">보유한 채권부터 확인해 보세요.</h2><p>현재 실제 등록은 모니터링 화면의 백엔드 API와 연결되어 있습니다.</p></div>
          <div className="quickstart-form"><label htmlFor="quick-bond">채권명</label><div><input ref={searchRef} id="quick-bond" value={quickQuery} onChange={(event) => setQuickQuery(event.target.value)} placeholder="예: 대한항공 101" />{quickQuery && <button type="button" className="clear-button" onClick={() => { setQuickQuery(""); searchRef.current?.focus(); }} aria-label="채권명 지우기">×</button>}<button type="button" className="light-button" onClick={() => setModal("register")}>등록 흐름 보기</button></div><button type="button" className="roadmap-button" onClick={() => setModal("roadmap")}>아직 연동되지 않은 기능 확인</button></div>
        </section>
      </main>

      <footer className="landing-footer"><Link className="wordmark" to="/">Bonda</Link><p>검증된 변화를 보고, 판단은 직접 합니다.</p><nav aria-label="하단 메뉴"><button type="button" onClick={() => setModal("terms")}>이용 안내</button><button type="button" onClick={() => setModal("roadmap")}>개발 예정</button><Link to="/admin/replay">과거 재현</Link></nav></footer>

      <LoginDemo open={modal === "login"} onClose={() => setModal(null)} onDemoLogin={demoLogin} />
      <PricingDemo open={modal === "pricing"} onClose={() => setModal(null)} />
      <RoadmapDialog open={modal === "roadmap"} onClose={() => setModal(null)} />
      <KakaoDemo open={modal === "kakao"} onClose={() => setModal(null)} bondName={activeBond.name} />
      <Dialog open={modal === "principles"} onClose={() => setModal(null)} title="세 단계 판정 구조" eyebrow="사실과 해석을 분리"><div className="dialog-copy"><h3>1. 원문 일치</h3><p>AI가 찾은 후보는 원문 evidence, 금액, 날짜와 발행사 연결을 규칙으로 다시 검사합니다.</p><h3>2. 위험 상태 계산</h3><p>검증된 Event와 재무 Snapshot만 versioned Risk Policy에 입력합니다.</p><h3>3. 제한적 설명</h3><p>AI 설명은 검증 데이터만 사용하며 부도 예측과 투자 추천을 하지 않습니다.</p></div></Dialog>
      <Dialog open={modal === "source"} onClose={() => setModal(null)} title="검증 원문 구간 예시" eyebrow="DART 미리보기"><div className="truth-note"><strong>예시 데이터</strong><p>실제 보유 채권에서는 Risk Event API가 검증한 구간을 표시합니다.</p></div><blockquote className="source-quote">“{activeBond.fact}”</blockquote><p className="dialog-caption">{activeBond.source}</p></Dialog>
      <Dialog open={modal === "terms"} onClose={() => setModal(null)} title="서비스 이용 안내" eyebrow="법률 문서 연동 전"><div className="dialog-copy"><h3>투자 판단</h3><p>Bonda는 신용 변화 확인을 돕는 정보 서비스이며 투자 권유나 원금 보장을 제공하지 않습니다.</p><h3>데이터 범위</h3><p>공개 공시와 검증된 내부 계산을 사용하며 정보 반영에는 시차가 있을 수 있습니다.</p><h3>현재 상태</h3><p>이 문구는 제품 UI를 위한 안내 초안이며 정식 약관이 아닙니다.</p></div></Dialog>
      <Dialog open={modal === "register"} onClose={() => setModal(null)} title="채권 등록 흐름 미리보기" eyebrow="실제 저장 전 단계"><form className="dialog-form" onSubmit={submitRegister} noValidate><label htmlFor="register-bond">채권명</label><input id="register-bond" value={quickQuery} onChange={(event) => setQuickQuery(event.target.value)} placeholder="예: 대한항공 101" aria-describedby="register-help" /><label htmlFor="register-date">매수일</label><input id="register-date" type="date" value={registerDate} onChange={(event) => setRegisterDate(event.target.value)} /><fieldset><legend>추후 제공할 알림 조건</legend><label><input type="checkbox" defaultChecked /> 신용 상태 변화</label><label><input type="checkbox" defaultChecked /> 중요 공시</label><label><input type="checkbox" /> 부채 부담 증가</label></fieldset><p id="register-help" className="field-help">알림 조건은 아직 저장되지 않습니다. 실제 보유 등록은 다음 화면에서 할 수 있습니다.</p><button className="primary-button" type="submit" disabled={!quickQuery.trim() || !registerDate}>등록 흐름 체험 완료</button><Link className="secondary-button" to="/monitoring" onClick={() => setModal(null)}>실제 보유 등록으로 이동</Link></form></Dialog>
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </div>
  );
}
