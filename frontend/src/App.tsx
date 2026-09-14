import { Route, Routes } from "react-router-dom";
import HistoricalReplayPage from "./HistoricalReplayPage";
import LandingPage from "./LandingPage";
import MonitoringPage from "./MonitoringPage";
import NotFoundPage from "./NotFoundPage";
import RiskEventPage from "./RiskEventPage";
import SinceBoughtPage from "./SinceBoughtPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/monitoring" element={<MonitoringPage />} />
      <Route path="/holdings/:holdingId/since-bought" element={<SinceBoughtPage />} />
      <Route path="/risk-events/:riskEventId" element={<RiskEventPage />} />
      <Route path="/admin/replay" element={<HistoricalReplayPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
