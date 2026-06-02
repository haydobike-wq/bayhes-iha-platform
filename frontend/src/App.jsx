import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OperationHeader from './components/OperationHeader.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ModulePage from './pages/ModulePage.jsx';

function ExternalRedirect({ to }) {
  React.useEffect(() => {
    window.location.assign(to);
  }, [to]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <OperationHeader />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/module/:categoryId/:moduleId" element={<ModulePage />} />
          <Route path="/bayhes" element={<ExternalRedirect to="/bayhes-risk/index.html" />} />
          <Route path="/iha" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/iha-performans" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/imu-simulation" element={<Navigate to="/module/uav/imu-simulation" replace />} />
          <Route path="/imu-simulasyonu" element={<Navigate to="/module/uav/imu-simulation" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
