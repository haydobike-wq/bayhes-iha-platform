import React from 'react';
import { AlertTriangle, Clock, Radio, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';

export default function Navbar() {
  return (
    <header className="top-status-bar">
      <div className="system-title">
        <BrandLogo compact />
        <div>
          <strong>Avionix Ground Control Interface</strong>
          <span>Mission systems dashboard</span>
        </div>
      </div>

      <div className="status-strip" aria-label="Sistem durumu">
        <span className="status-pill status-pill--online">
          <Radio size={15} />
          Bağlı
        </span>
        <span className="status-pill">Uçuş Modu: Manuel</span>
        <span className="status-pill">Görev: Hazırlık</span>
        <span className="status-pill">
          <Clock size={15} />
          T+ 00:12:48
        </span>
        <span className="status-pill status-pill--safe">
          <ShieldCheck size={15} />
          Nominal
        </span>
        <span className="status-pill status-pill--danger">
          <AlertTriangle size={15} />
          Acil: Pasif
        </span>
      </div>
    </header>
  );
}
