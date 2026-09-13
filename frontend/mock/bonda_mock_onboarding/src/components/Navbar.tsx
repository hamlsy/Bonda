import React, { useState } from 'react';
import { Menu, X, User, Bell, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenPricing: () => void;
  onOpenPrinciples: () => void;
  onOpenAlerts: () => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegister,
  onOpenLogin,
  onOpenPricing,
  onOpenPrinciples,
  onOpenAlerts,
  user,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-indigo-100/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-sm tracking-tighter">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0b1c30]">
              Bonda<span className="text-indigo-600 ml-0.5 font-extrabold">AI</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => scrollToSection('demo-preview')}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#464555] hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              서비스 소개
            </button>
            <button
              onClick={onOpenPrinciples}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#464555] hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              3대 투명성 원칙
            </button>
            <button
              onClick={onOpenAlerts}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#464555] hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              <span>신용 리스크 알림</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            </button>
            <button
              onClick={onOpenPricing}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#464555] hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              요금 안내
            </button>
          </nav>
        </div>

        {/* Right CTA / Auth controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200/60 text-indigo-900 transition-all text-xs font-semibold"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                  {user.name.slice(0, 1)}
                </div>
                <span className="hidden sm:inline">{user.name}님</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">Pro</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenRegister();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    + 보유 채권 추가 등록
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-[#464555] hover:bg-indigo-50 hover:text-indigo-900 rounded-lg transition-colors"
              >
                로그인
              </button>
              <button
                onClick={onOpenRegister}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                무료로 시작하기
              </button>
              <button
                onClick={onOpenLogin}
                aria-label="User Account"
                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <User size={16} />
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 bg-[#f8f9ff] border-b border-indigo-100 shadow-lg space-y-2">
          <button
            onClick={() => scrollToSection('demo-preview')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50"
          >
            서비스 소개
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPrinciples();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50"
          >
            3대 투명성 원칙
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAlerts();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 flex items-center justify-between"
          >
            <span>신용 리스크 알림</span>
            <span className="text-[11px] px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full">실시간</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPricing();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50"
          >
            요금 안내
          </button>
          <div className="pt-2 border-t border-slate-200 flex gap-2">
            {!user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-200 text-slate-800"
              >
                로그인
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-indigo-600 text-white"
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
