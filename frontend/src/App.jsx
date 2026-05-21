import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import RocketBayhes from './pages/RocketBayhes.jsx';
import UavPerformance from './pages/UavPerformance.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bayhes" element={<RocketBayhes />} />
          <Route path="/iha" element={<UavPerformance />} />
          <Route path="/iha-performans" element={<UavPerformance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
