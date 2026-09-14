import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import HistoricalReplayPage from "./HistoricalReplayPage";
import MonitoringPage from "./MonitoringPage";
import NotFoundPage from "./NotFoundPage";
import RiskEventPage from "./RiskEventPage";
import SinceBoughtPage from "./SinceBoughtPage";

const MockOnboarding = lazy(() => import("../mock/bonda_mock_onboarding/src/App"));

function MockScreen({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#f8f9ff]" aria-label="화면 불러오는 중" />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MockScreen><MockOnboarding /></MockScreen>} />
      <Route path="/monitoring" element={<MonitoringPage />} />
      <Route path="/holdings/:holdingId/since-bought" element={<SinceBoughtPage />} />
      <Route path="/risk-events/:riskEventId" element={<RiskEventPage />} />
      <Route path="/admin/replay" element={<HistoricalReplayPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
