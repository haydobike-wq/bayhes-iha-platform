import React, { useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import InputField from '../components/InputField.jsx';
import ResultCard from '../components/ResultCard.jsx';

const G = 9.81;
const RHO = 1.225;
const WING_AREA = 0.30306;
const CL_MAX = 1.30;
const CL_TAKEOFF = 0.80;
const CD_TAKEOFF = 0.08;
const MOTOR_THRUST = 22.58;
const TAKEOFF_SPEED_FACTOR = 1.30;
const ROLLING_FRICTION = 0.04;
const MIN_THRUST_WEIGHT = 0.30;

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('tr-TR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function calculatePerformance(weightKg, runwayM, windMps) {
  const weightN = weightKg * G;
  const stallSpeed = Math.sqrt((2 * weightN) / (RHO * WING_AREA * CL_MAX));
  const takeoffSpeed = stallSpeed * TAKEOFF_SPEED_FACTOR;
  const effectiveTakeoffSpeed = Math.max(takeoffSpeed - windMps * 0.18, stallSpeed * 1.12);
  const thrustWeight = MOTOR_THRUST / weightN;
  const liftAtTakeoff = 0.5 * RHO * effectiveTakeoffSpeed ** 2 * WING_AREA * CL_TAKEOFF;
  const dragAtTakeoff = 0.5 * RHO * effectiveTakeoffSpeed ** 2 * WING_AREA * CD_TAKEOFF;
  const rollingResistance = ROLLING_FRICTION * Math.max(weightN - liftAtTakeoff, 0);
  const netForce = MOTOR_THRUST - dragAtTakeoff - rollingResistance;
  const acceleration = netForce / weightKg;
  const safeAcceleration = Math.max(acceleration, 0);
  const takeoffTime = safeAcceleration > 0 ? effectiveTakeoffSpeed / safeAcceleration : Infinity;
  const requiredRunway =
    safeAcceleration > 0 ? effectiveTakeoffSpeed ** 2 / (2 * safeAcceleration) : Infinity;

  return {
    weightN,
    stallSpeed,
    takeoffSpeed,
    effectiveTakeoffSpeed,
    thrustWeight,
    acceleration,
    takeoffTime,
    requiredRunway,
    runwayOk: runwayM >= requiredRunway,
    motorOk: thrustWeight >= MIN_THRUST_WEIGHT && acceleration > 0,
  };
}

export default function UavPerformance() {
  const [form, setForm] = useState({ weightKg: '3.2', runwayM: '85', windMps: '2' });

  const values = useMemo(() => {
    const weightKg = Number(form.weightKg);
    const runwayM = Number(form.runwayM);
    const windMps = Number(form.windMps);
    if (!weightKg || !runwayM || weightKg <= 0 || runwayM <= 0 || !Number.isFinite(windMps)) {
      return null;
    }
    return calculatePerformance(weightKg, runwayM, windMps);
  }, [form]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="module-content">
      <div className="module-intro">
        <p>
          Sabit kanat İHA için günlük kalkış değişkenlerine göre pist yeterliliği, güvenli kalkış
          hızı ve motor itki değerlendirmesi.
        </p>
      </div>

      <div className="workspace-grid">
        <form className="panel form-panel">
          <fieldset>
            <legend>Günlük Uçuş Değerleri</legend>
            <div className="form-grid">
              <InputField
                label="Kalkış ağırlığı"
                name="weightKg"
                unit="kg"
                value={form.weightKg}
                onChange={handleChange}
                min={0}
              />
              <InputField
                label="Mevcut pist uzunluğu"
                name="runwayM"
                unit="m"
                value={form.runwayM}
                onChange={handleChange}
                min={0}
              />
              <InputField
                label="Rüzgar hızı"
                name="windMps"
                unit="m/s"
                value={form.windMps}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          <div className="constant-list" aria-label="Sabit uçak parametreleri">
            <span>Kanat alanı: {WING_AREA} m²</span>
            <span>CL max: {CL_MAX}</span>
            <span>Motor itkisi: {MOTOR_THRUST} N</span>
          </div>
        </form>

        <aside className="results-column">
          <div className="panel">
            <h2>Performans Sonuçları</h2>
            {values ? (
              <div className="result-grid">
                <ResultCard
                  label="Stall hızı"
                  value={`${formatNumber(values.stallSpeed, 2)} m/s`}
                  helper={`${formatNumber(values.stallSpeed * 3.6, 1)} km/h`}
                />
                <ResultCard
                  label="Güvenli kalkış hızı"
                  value={`${formatNumber(values.effectiveTakeoffSpeed, 2)} m/s`}
                  helper={`${formatNumber(values.effectiveTakeoffSpeed * 3.6, 1)} km/h`}
                />
                <ResultCard
                  label="Gerekli pist"
                  value={
                    Number.isFinite(values.requiredRunway)
                      ? `${formatNumber(values.requiredRunway)} m`
                      : 'Hesaplanamadı'
                  }
                  tone={values.runwayOk ? 'success' : 'warning'}
                />
                <ResultCard
                  label="Kalkış süresi"
                  value={
                    Number.isFinite(values.takeoffTime)
                      ? `${formatNumber(values.takeoffTime, 2)} s`
                      : 'Hesaplanamadı'
                  }
                />
                <ResultCard
                  label="İtki/ağırlık oranı"
                  value={formatNumber(values.thrustWeight, 2)}
                  tone={values.motorOk ? 'success' : 'warning'}
                />
                <ResultCard
                  label="Operasyon sonucu"
                  value={values.runwayOk && values.motorOk ? 'Güvenli görünüyor' : 'Riskli olabilir'}
                  tone={values.runwayOk && values.motorOk ? 'success' : 'warning'}
                />
              </div>
            ) : (
              <div className="empty-state">Geçerli ağırlık, pist ve rüzgar değeri girin.</div>
            )}
          </div>

          <div className="panel note-panel">
            <Gauge size={28} />
            <h2>Analiz Notu</h2>
            <p>
              Sonuçlar yaklaşık mühendislik hesabıdır; gerçek uçuş testi, saha emniyeti ve kontrol
              prosedürlerinin yerine geçmez.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
