import React from 'react';
import CategorySelector from '../components/CategorySelector.jsx';
import { categories } from '../data/modules.js';

export default function Home() {
  return (
    <section className="home-page">
      <div className="operation-welcome">
        <p className="eyebrow">Operasyon paneli</p>
        <h1>Avionix Aerospace Görev ve Operasyon Paneli</h1>
        <p>
          Araç kategorisini seçerek ilgili analiz ve kontrol modüllerine erişin. Modüller sistem
          geliştikçe bu panel üzerinden genişletilecektir.
        </p>
      </div>

      <CategorySelector categories={categories} />

      <div className="system-note">
        <strong>Modül seçerek analiz ve kontrol ekranlarına erişin.</strong>
        <span>
          Bu arayüz eğitim, test, simülasyon ve güvenli operasyon analizi amacıyla hazırlanmıştır.
        </span>
      </div>
    </section>
  );
}
