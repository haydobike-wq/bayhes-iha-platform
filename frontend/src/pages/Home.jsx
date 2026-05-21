import React from 'react';
import { ArrowRight, Plane, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: 'Roket / BAYHES',
    description: 'Model roketler için yörünge, irtifa, uçuş süresi ve tahmini düşüş alanı analizi.',
    href: '/bayhes',
    icon: Rocket,
  },
  {
    title: 'İHA Performans Hesaplayıcı',
    description:
      'Sabit kanat İHA için stall hızı, güvenli kalkış hızı, gerekli pist ve motor yeterlilik analizi.',
    href: '/iha',
    icon: Plane,
  },
];

export default function Home() {
  return (
    <section className="home-page">
      <div className="hero">
        <p className="eyebrow">AR-GE uçuş analizi</p>
        <h1>Mühendislik Hesaplama ve Simülasyon Platformu</h1>
        <p>
          Roket ve İHA projeleri için temel uçuş analizi, güvenli alan tahmini ve performans
          hesaplama araçları.
        </p>
      </div>

      <div className="module-grid" aria-label="Mühendislik modülleri">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link className="module-card" to={module.href} key={module.title}>
              <div className="module-icon">
                <Icon size={30} />
              </div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <span className="module-action">
                Aç
                <ArrowRight size={18} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
