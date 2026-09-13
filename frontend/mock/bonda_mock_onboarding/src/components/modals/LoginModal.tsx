import React, { useState } from 'react';
import { X, Mail, Lock, Sparkles } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('investor@bonda.ai');
  const [name, setName] = useState('홍길동');

  const handleKakaoLogin = () => {
    onLoginSuccess({ name: '김채권', email: 'bond_investor@kakao.com' });
  };

  const handleGoogleLogin = () => {
    onLoginSuccess({ name: '홍길동', email: 'dltmddud1122@gmail.com' });
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({ name: name || '채권투자자', email: email || 'user@example.com' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 text-center relative border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2 shadow-sm">
            B
          </div>
          <h3 className="text-lg font-bold text-[#0b1c30]">
            Bonda AI 로그인
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            등록된 내 채권의 24시간 감시 리포트 확인
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* 1-click social logins */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <span className="w-5 h-5 rounded-full bg-[#3C1E1E] text-[#FEE500] flex items-center justify-center font-bold text-[10px]">
              톡
            </span>
            <span>카카오로 3초 간편 시작</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google 계정으로 계속하기</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 absolute">또는 이메일</span>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">성함 / 닉네임</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                placeholder="investor@bonda.ai"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              로그인 / 간편가입
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
