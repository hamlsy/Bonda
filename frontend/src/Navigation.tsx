import { Link, useLocation } from "react-router-dom";

type AppHeaderProps = {
  status?: string;
  backLabel?: string;
  backTo?: string;
};

export function AppHeader({ status, backLabel, backTo = "/" }: AppHeaderProps) {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Bonda 홈">Bonda</Link>
      <nav className="primary-nav" aria-label="주요 메뉴">
        <Link to="/#my-bonds">내 채권</Link>
        <Link to="/#watchlist">관심 채권</Link>
        <Link to="/#alerts">알림</Link>
        <Link to="/admin/replay">과거 재현</Link>
      </nav>
      <div className="header-context">
        {backLabel && <Link className="back-link" to={backTo}>{backLabel}</Link>}
        {status && <p>{status}</p>}
      </div>
    </header>
  );
}

export function MobileNav() {
  const location = useLocation();
  const isHome = location.pathname === "/" && location.hash === "";
  const isSince = location.pathname.includes("/since-bought") || location.hash === "#my-bonds";
  const isEvidence = location.pathname.includes("/risk-events/") || location.hash === "#alerts";
  const isReplay = location.pathname === "/admin/replay";

  return (
    <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
      <Link to="/" aria-current={isHome ? "page" : undefined}><span aria-hidden="true">⌂</span>홈</Link>
      <Link to="/#my-bonds" aria-current={isSince ? "page" : undefined}><span aria-hidden="true">▤</span>내 채권</Link>
      <Link to="/#alerts" aria-current={isEvidence ? "page" : undefined}><span aria-hidden="true">●</span>알림</Link>
      <Link to="/admin/replay" aria-current={isReplay ? "page" : undefined}><span aria-hidden="true">↺</span>재현</Link>
    </nav>
  );
}
