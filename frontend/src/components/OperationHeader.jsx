import React, { useEffect, useState } from 'react';
import { Clock, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';

function formatClock(date) {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default function OperationHeader() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="operation-header">
      <Link to="/" className="operation-brand" aria-label="Ana panele dön">
        <BrandLogo compact />
        <div>
          <strong>Avionix Aerospace Görev ve Operasyon Paneli</strong>
          <span>Modüler analiz ve kontrol arayüzü</span>
        </div>
      </Link>

      <div className="header-status" aria-label="Sistem durumu">
        <span className="status-pill status-pill--online">
          <Radio size={15} />
          Sistem Durumu: Aktif
        </span>
        <span className="status-pill">Demo Modu</span>
        <span className="status-pill status-pill--safe">
          <ShieldCheck size={15} />
          Nominal
        </span>
        <span className="status-pill">
          <Clock size={15} />
          {formatClock(now)}
        </span>
      </div>
    </header>
  );
}
