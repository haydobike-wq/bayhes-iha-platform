import React from 'react';

export default function ImuSimulationModule() {
  return (
    <section className="module-panel">
      <div className="module-panel__header">
        <div>
          <p className="eyebrow">Gerçek zamanlı yönelim</p>
          <h2>IMU Simülasyonu</h2>
          <p>
            ESP32-S3 + MPU6050 üzerinden gelen roll, pitch ve yaw verileriyle 3D uçak
            yönelim simülasyonu için ayrılmış modüldür.
          </p>
        </div>
      </div>

      <div className="empty-state">
        IMU veri akışı bağlandığında gerçek zamanlı yönelim çıktıları burada gösterilecektir.
      </div>
    </section>
  );
}
