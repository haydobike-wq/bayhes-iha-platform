import React, { useState } from 'react';
import ResultCard from '../components/ResultCard.jsx';

const PERFORMANCE_CONSTANTS = {
  wingArea: 0.30306,
  clMax: 1.3,
  clTakeoff: 0.8,
  cdTakeoff: 0.08,
  motorThrust: 22.58,
  gravity: 9.81,
  airDensity: 1.225,
  takeoffSpeedFactor: 1.3,
  rollingFriction: 0.04,
};

const initialResults = {
  stallSpeedMs: '-',
  stallSpeedKmh: '-',
  takeoffSpeedMs: '-',
  takeoffSpeedKmh: '-',
  requiredRunway: '-',
  minimumSafeRunway: '-',
  runwayMargin: '-',
  takeoffTime: '-',
  takeoffAcceleration: '-',
  thrustWeight: '-',
  thrustStatus: '-',
  runwayStatus: '-',
  runwayUsage: '-',
  takeoffDecision: '-',
  riskLevel: '-',
  tones: {},
};

function parseNumber(value) {
  return Number(String(value).trim().replace(',', '.'));
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('tr-TR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function calculatePerformance(massKg, runwayLength) {
  const c = PERFORMANCE_CONSTANTS;
  const weightN = massKg * c.gravity;
  const stallSpeed = Math.sqrt((2 * weightN) / (c.airDensity * c.wingArea * c.clMax));
  const takeoffSpeed = stallSpeed * c.takeoffSpeedFactor;
  const dynamicPressure = 0.5 * c.airDensity * takeoffSpeed * takeoffSpeed;
  const drag = dynamicPressure * c.wingArea * c.cdTakeoff;
  const liftAtTakeoff = dynamicPressure * c.wingArea * c.clTakeoff;
  const rollingResistance = c.rollingFriction * Math.max(weightN - liftAtTakeoff, 0);
  const netForce = c.motorThrust - drag - rollingResistance;
  const acceleration = netForce / massKg;
  const requiredRunway = acceleration > 0 ? (takeoffSpeed * takeoffSpeed) / (2 * acceleration) : Infinity;
  const takeoffTime = acceleration > 0 ? takeoffSpeed / acceleration : Infinity;
  const thrustWeightRatio = c.motorThrust / weightN;
  const minimumSafeRunway = Number.isFinite(requiredRunway) ? requiredRunway * 1.2 : Infinity;
  const runwayMargin = runwayLength - minimumSafeRunway;
  const runwayIsEnough = Number.isFinite(minimumSafeRunway) && runwayLength >= minimumSafeRunway;
  const runwayUsage = Number.isFinite(minimumSafeRunway) ? (minimumSafeRunway / runwayLength) * 100 : Infinity;

  let thrustStatus = 'YETERSİZ';
  let thrustTone = 'warning';
  if (thrustWeightRatio >= 0.55) {
    thrustStatus = 'YETERLİ';
    thrustTone = 'success';
  } else if (thrustWeightRatio >= 0.4) {
    thrustStatus = 'SINIRDA';
    thrustTone = 'warning';
  }

  const runwayStatus = runwayIsEnough ? 'YETERLİ' : 'YETERSİZ';
  const runwayTone = runwayIsEnough ? 'success' : 'warning';

  let decision = 'KALKIŞ RİSKLİ / UYGUN DEĞİL';
  let decisionTone = 'warning';
  let risk = 'YÜKSEK';
  let riskTone = 'warning';

  if (runwayIsEnough && thrustStatus === 'YETERLİ') {
    decision = 'KALKIŞ UYGUN';
    decisionTone = 'success';
    risk = 'DÜŞÜK';
    riskTone = 'success';
  } else if (runwayIsEnough && thrustStatus === 'SINIRDA') {
    decision = 'KALKIŞ SINIRDA';
    decisionTone = 'warning';
    risk = 'ORTA';
    riskTone = 'warning';
  }

  return {
    stallSpeedMs: `${formatNumber(stallSpeed, 2)} m/s`,
    stallSpeedKmh: `${formatNumber(stallSpeed * 3.6, 1)} km/h`,
    takeoffSpeedMs: `${formatNumber(takeoffSpeed, 2)} m/s`,
    takeoffSpeedKmh: `${formatNumber(takeoffSpeed * 3.6, 1)} km/h`,
    requiredRunway: Number.isFinite(requiredRunway) ? `${formatNumber(requiredRunway, 1)} m` : 'Yetersiz itki',
    minimumSafeRunway: Number.isFinite(minimumSafeRunway) ? `${formatNumber(minimumSafeRunway, 1)} m` : '-',
    runwayMargin: Number.isFinite(runwayMargin) ? `${formatNumber(runwayMargin, 1)} m` : '-',
    takeoffTime: Number.isFinite(takeoffTime) ? `${formatNumber(takeoffTime, 1)} s` : '-',
    takeoffAcceleration: acceleration > 0 ? `${formatNumber(acceleration, 2)} m/s²` : 'Yetersiz',
    thrustWeight: formatNumber(thrustWeightRatio, 2),
    thrustStatus,
    runwayStatus,
    runwayUsage: Number.isFinite(runwayUsage) ? `%${formatNumber(runwayUsage, 0)}` : '-',
    takeoffDecision: decision,
    riskLevel: risk,
    tones: {
      thrustStatus: thrustTone,
      runwayStatus: runwayTone,
      takeoffDecision: decisionTone,
      riskLevel: riskTone,
      runwayMargin: runwayIsEnough ? 'success' : 'warning',
      runwayUsage: runwayUsage <= 80 ? 'success' : runwayUsage <= 100 ? 'warning' : 'warning',
    },
  };
}

export default function UavPerformance() {
  const [form, setForm] = useState({ massKg: '3.5', runwayLength: '55' });
  const [results, setResults] = useState(initialResults);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const massKg = parseNumber(form.massKg);
    const runwayLength = parseNumber(form.runwayLength);

    if (![massKg, runwayLength].every(Number.isFinite) || massKg <= 0 || runwayLength <= 0) {
      setResults({ ...initialResults, takeoffDecision: 'Geçersiz veri' });
      return;
    }

    setResults(calculatePerformance(massKg, runwayLength));
  }

  return (
    <section className="module-content">
      <div className="module-intro">
        <p>Sabit kanat İHA için kalkış, pist, hız ve temel uçuş performansı analizleri.</p>
      </div>

      <div className="workspace-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <fieldset>
            <legend>Kalkış Verileri</legend>
            <div className="form-grid">
              <label className="input-field">
                <span>Uçak kalkış ağırlığı</span>
                <div className="input-shell">
                  <input
                    name="massKg"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.massKg}
                    onChange={handleChange}
                  />
                  <small>kg</small>
                </div>
              </label>
              <label className="input-field">
                <span>Pist uzunluğu</span>
                <div className="input-shell">
                  <input
                    name="runwayLength"
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.runwayLength}
                    onChange={handleChange}
                  />
                  <small>m</small>
                </div>
              </label>
            </div>
          </fieldset>

          <button className="primary-button" type="submit">
            Hesapla
          </button>
        </form>

        <aside className="results-column">
          <div className="panel">
            <h2>Kalkış Analizi</h2>
            <div className="result-grid">
              <ResultCard label="Stall hızı" value={results.stallSpeedKmh} helper={results.stallSpeedMs} />
              <ResultCard
                label="Güvenli kalkış hızı"
                value={results.takeoffSpeedKmh}
                helper={results.takeoffSpeedMs}
              />
              <ResultCard label="Gerekli pist uzunluğu" value={results.requiredRunway} />
              <ResultCard label="Minimum güvenli pist uzunluğu" value={results.minimumSafeRunway} />
              <ResultCard
                label="Pist güvenlik payı"
                value={results.runwayMargin}
                tone={results.tones.runwayMargin}
              />
              <ResultCard label="Kalkış süresi" value={results.takeoffTime} />
              <ResultCard label="Kalkış ivmesi" value={results.takeoffAcceleration} />
              <ResultCard label="İtki / ağırlık oranı" value={results.thrustWeight} />
              <ResultCard
                label="İtki yeterliliği"
                value={results.thrustStatus}
                tone={results.tones.thrustStatus}
              />
              <ResultCard
                label="Pist yeterliliği"
                value={results.runwayStatus}
                tone={results.tones.runwayStatus}
              />
              <ResultCard label="Pist kullanım oranı" value={results.runwayUsage} tone={results.tones.runwayUsage} />
              <ResultCard
                label="Genel kalkış kararı"
                value={results.takeoffDecision}
                tone={results.tones.takeoffDecision}
              />
              <ResultCard label="Risk seviyesi" value={results.riskLevel} tone={results.tones.riskLevel} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
