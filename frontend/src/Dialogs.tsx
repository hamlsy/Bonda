import { FormEvent, KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { roadmapItems } from "./demo";

type DialogProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "small" | "large";
};

export function Dialog({ open, title, eyebrow, onClose, children, size = "small" }: DialogProps) {
  const titleId = useId();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => surfaceRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !surfaceRef.current) return;
    const focusable = Array.from(surfaceRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    if (focusable.length === 0) {
      event.preventDefault();
      surfaceRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={surfaceRef}
        className={`dialog-surface dialog-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="dialog-header">
          <div>{eyebrow && <p className="dialog-eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="대화상자 닫기">×</button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);
  return <div className="toast" role="status" aria-live="polite"><span>{message}</span><button type="button" onClick={onDismiss} aria-label="알림 닫기">×</button></div>;
}

export function LoginDemo({ open, onClose, onDemoLogin }: { open: boolean; onClose: () => void; onDemoLogin: (name: string) => void }) {
  const [name, setName] = useState("홍길동");
  const [email, setEmail] = useState("investor@bonda.kr");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("이름과 올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    onDemoLogin(name.trim());
  }

  return (
    <Dialog open={open} onClose={onClose} title="로그인 화면 미리보기" eyebrow="계정 연동 준비 중">
      <div className="truth-note"><strong>데모 기능</strong><p>입력값은 서버에 전송하거나 저장하지 않습니다.</p></div>
      <div className="provider-actions">
        <button type="button" onClick={() => onDemoLogin("카카오 사용자")}>카카오로 계속하기</button>
        <button type="button" onClick={() => onDemoLogin("Google 사용자")}>Google로 계속하기</button>
      </div>
      <div className="or-rule"><span>또는 이메일 미리보기</span></div>
      <form className="dialog-form" onSubmit={submit} noValidate>
        <label htmlFor="demo-name">이름</label>
        <input id="demo-name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "login-demo-error" : "login-demo-help"} />
        <label htmlFor="demo-email">이메일</label>
        <input id="demo-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "login-demo-error" : "login-demo-help"} />
        <p id="login-demo-help" className="field-help">실제 인증과 계정 생성은 후속 API 연동 대상입니다.</p>
        {error && <p id="login-demo-error" className="form-error" role="alert">{error}</p>}
        <button type="submit" className="primary-button">화면에서만 로그인 체험</button>
      </form>
    </Dialog>
  );
}

export function PricingDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  return (
    <Dialog open={open} onClose={onClose} title="요금제 미리보기" eyebrow="결제 연동 전" size="large">
      <div className="truth-note"><strong>가격 정책 검토 중</strong><p>현재 화면에서는 결제가 발생하지 않습니다.</p></div>
      <div className="segmented" aria-label="결제 주기">
        <button type="button" aria-pressed={cycle === "monthly"} onClick={() => setCycle("monthly")}>월간</button>
        <button type="button" aria-pressed={cycle === "yearly"} onClick={() => setCycle("yearly")}>연간</button>
      </div>
      <div className="pricing-grid">
        <article><p className="plan-name">기본</p><h3>무료</h3><p>보유 채권 3개와 검증된 공시 변화 확인</p><button type="button" onClick={onClose}>현재 기능으로 시작</button></article>
        <article className="featured-plan"><p className="plan-name">확장 예정</p><h3>{cycle === "yearly" ? "월 19,900원 예시" : "월 24,900원 예시"}</h3><p>외부 알림, 종목 확장, 고급 분석을 위한 화면 설계안</p><button type="button" onClick={onClose}>출시 전 화면 확인 완료</button></article>
      </div>
    </Dialog>
  );
}

export function RoadmapDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="연동 예정 기능" eyebrow="프론트 UI 먼저 구현" size="large">
      <ol className="roadmap-list">{roadmapItems.map(([title, detail], index) => <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol>
      <div className="dialog-actions"><Link className="primary-button" to="/monitoring" onClick={onClose}>현재 구현된 기능 열기</Link></div>
    </Dialog>
  );
}

export function KakaoDemo({ open, onClose, bondName }: { open: boolean; onClose: () => void; bondName: string }) {
  return (
    <Dialog open={open} onClose={onClose} title="외부 알림 미리보기" eyebrow="발송되지 않는 데모">
      <div className="message-preview">
        <div className="message-channel"><span>알림 예시</span><small>오늘 오전 8:30</small></div>
        <h3>{bondName}</h3>
        <p><strong>관찰할 변화가 확인되었습니다.</strong></p>
        <p>검증된 공시 원문과 계산 결과를 Bonda에서 확인해 주세요.</p>
        <button type="button" onClick={onClose}>리포트 열기 예시</button>
      </div>
      <p className="dialog-caption">연락처 인증, 알림 조건 저장, 실제 발송은 후속 백엔드 개발 범위입니다.</p>
    </Dialog>
  );
}
