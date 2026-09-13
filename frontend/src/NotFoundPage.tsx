import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "./Navigation";

export default function NotFoundPage() {
  useEffect(() => { document.title = "페이지를 찾을 수 없음 | Bonda"; }, []);
  return <div className="app-shell"><AppHeader /><main><section className="not-found"><p className="context-label"><span />404</p><h1>이 주소에는 화면이 없습니다.</h1><p>주소를 다시 확인하거나 내 채권 화면으로 이동해 주세요.</p><div><Link className="primary-button" to="/monitoring">내 채권 보기</Link><Link className="secondary-button" to="/">Bonda 소개</Link></div></section></main></div>;
}
