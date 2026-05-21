import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OperationHeader from './components/OperationHeader.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ModulePage from './pages/ModulePage.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <OperationHeader />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/module/:categoryId/:moduleId" element={<ModulePage />} />
          <Route path="/bayhes" element={<Navigate to="/module/rocket/bayhes" replace />} />
          <Route path="/iha" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="/iha-performans" element={<Navigate to="/module/uav/performance" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
