import { Link, useLocation } from "react-router-dom";

type AppHeaderProps = {
  status?: string;
  statusTone?: "normal" | "warning" | "error" | "muted";
  backLabel?: string;
  backTo?: string;
};

function routeState(pathname: string, hash: string) {
  const isPortfolioRoute = pathname === "/";
  const isWatchlist = isPortfolioRoute && hash === "#watchlist";
  const isAlerts = pathname.includes("/risk-events/") || (isPortfolioRoute && hash === "#alerts");
  return {
    isMyBonds: (isPortfolioRoute && !isWatchlist && !isAlerts) || pathname.includes("/since-bought"),
    isWatchlist,
    isAlerts,
    isReplay: pathname === "/admin/replay",
  };
}

export function AppHeader({ status, statusTone = "muted", backLabel, backTo = "/" }: AppHeaderProps) {
  const location = useLocation();
  const { isMyBonds, isWatchlist, isAlerts, isReplay } = routeState(location.pathname, location.hash);

  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Bonda 홈">Bonda</Link>
      <nav className="primary-nav" aria-label="주요 메뉴">
        <Link to="/#my-bonds" aria-current={isMyBonds ? "page" : undefined}>내 채권</Link>
        <Link to="/#watchlist" aria-current={isWatchlist ? "page" : undefined}>관심 채권</Link>
        <Link to="/#alerts" aria-current={isAlerts ? "page" : undefined}>알림</Link>
        <Link to="/admin/replay" aria-current={isReplay ? "page" : undefined}>과거 재현</Link>
      </nav>
      <div className="header-context">
        {backLabel && <Link className="back-link" to={backTo}>{backLabel}</Link>}
        {status && <p className="header-status" data-tone={statusTone}><span aria-hidden="true">{statusTone === "normal" ? "●" : statusTone === "muted" ? "○" : "!"}</span>{status}</p>}
      </div>
    </header>
  );
}

export function MobileNav() {
  const location = useLocation();
  const { isMyBonds, isWatchlist, isAlerts } = routeState(location.pathname, location.hash);

  return (
    <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
      <Link to="/#my-bonds" aria-current={isMyBonds ? "page" : undefined}>내 채권</Link>
      <Link to="/#watchlist" aria-current={isWatchlist ? "page" : undefined}>관심 채권</Link>
      <Link to="/#alerts" aria-current={isAlerts ? "page" : undefined}>알림</Link>
    </nav>
  );
}
