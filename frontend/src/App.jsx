import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import OperationHeader from './components/OperationHeader.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ModulePage from './pages/ModulePage.jsx';

function ExternalRedirect({ to }) {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}

function LegacyHashRedirect() {
  React.useEffect(() => {
    const redirectLegacyHash = () => {
      const hash = window.location.hash.replace("#", "");
      const targets = {
        bayhesPage: "/bayhes-risk/index.html",
        bayhesRiskPage: "/bayhes-risk/index.html",
        rocketSystemsPage: "/category/rocket",
        homePage: "/",
        performancePage: "/module/uav/performance",
        imuSimulationPage: "/legacy-dashboard/index.html#imuSimulationPage",
      };

      if (targets[hash]) {
        window.location.replace(targets[hash]);
      }
    };

    redirectLegacyHash();
    window.addEventListener("hashchange", redirectLegacyHash);
    return () => window.removeEventListener("hashchange", redirectLegacyHash);
  }, []);

  return null;
}

export default function App() {
  const location = useLocation();
  const performancePaths = new Set([
    "/module/uav/performance",
    "/performance",
    "/performans",
    "/performance-params",
    "/performanceParams",
    "/uavPerformance",
    "/performans-parametreleri",
    "/iha-performans",
  ]);
  const hideOperationChrome =
    performancePaths.has(location.pathname) || window.location.hash === "#performancePage";

  return (
    <div className="app-shell">
      <LegacyHashRedirect />
      {!hideOperationChrome && <OperationHeader />}
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/module/:categoryId/:moduleId" element={<ModulePage />} />
          <Route path="/bayhes" element={<ExternalRedirect to="/bayhes-risk/index.html" />} />
          <Route path="/iha" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/iha-performans" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/performance" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/performans" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/performance-params" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/performanceParams" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/uavPerformance" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/performans-parametreleri" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/legacy-dashboard/index.html" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/imu" element={<ExternalRedirect to="/legacy-dashboard/index.html#imuSimulationPage" />} />
          <Route path="/imu-simulation" element={<ExternalRedirect to="/legacy-dashboard/index.html#imuSimulationPage" />} />
          <Route path="/imu-simulasyonu" element={<ExternalRedirect to="/legacy-dashboard/index.html#imuSimulationPage" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideOperationChrome && <Footer />}
    </div>
  );
}
