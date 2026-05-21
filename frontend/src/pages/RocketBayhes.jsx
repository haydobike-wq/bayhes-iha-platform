import React, { useMemo, useState } from 'react';
import { Activity, Map } from 'lucide-react';
import InputField from '../components/InputField.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { API_BASE_URL } from '../config.js';

const initialForm = {
  launch_lat: '39.9208',
  launch_lon: '32.8541',
  target_lat: '39.9308',
  target_lon: '32.8741',
  dry_mass: '4.5',
  prop_mass: '1.1',
  diameter_m: '0.11',
  cd: '0.45',
  thrust_avg: '180',
  burn_s: '2.4',
  wind: '1.5',
  elevation_deg: '78',
};

const fieldGroups = [
  {
    title: 'Konum Bilgileri',
    fields: [
      ['Fırlatma latitude', 'launch_lat', 'deg', -90, 90],
      ['Fırlatma longitude', 'launch_lon', 'deg', -180, 180],
      ['Referans latitude', 'target_lat', 'deg', -90, 90],
      ['Referans longitude', 'target_lon', 'deg', -180, 180],
    ],
  },
  {
    title: 'Roket Parametreleri',
    fields: [
      ['Kuru kütle', 'dry_mass', 'kg', 0],
      ['Yakıt / propellant kütlesi', 'prop_mass', 'kg', 0],
      ['Roket çapı', 'diameter_m', 'm', 0],
      ['Sürükleme katsayısı Cd', 'cd', '', 0],
    ],
  },
  {
    title: 'Motor Parametreleri',
    fields: [
      ['Ortalama itki', 'thrust_avg', 'N', 0],
      ['Yanma süresi', 'burn_s', 's', 0],
    ],
  },
  {
    title: 'Çevresel Parametreler',
    fields: [
      ['Rüzgar', 'wind', 'm/s'],
      ['Fırlatma açısı / elevation', 'elevation_deg', 'deg', 0, 90],
    ],
  },
];

function toNumberPayload(form) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
}

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('tr-TR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export default function RocketBayhes() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(
    () => Object.values(form).every((value) => value !== '' && Number.isFinite(Number(value))),
    [form],
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!isValid) {
      setError('Lütfen tüm alanları geçerli sayısal değerlerle doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bayhes/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toNumberPayload(form)),
      });
      const data = await response
        .json()
        .catch(() => ({ detail: { message: 'Backend yanıtı okunamadı.' } }));

      if (!response.ok) {
        const message = data?.detail?.message || 'Simülasyon çalıştırılamadı.';
        throw new Error(message);
      }

      setResult(data);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? `Backend'e bağlanılamadı. Lütfen ${API_BASE_URL} adresindeki backend'in çalıştığını kontrol edin.`
          : err.message || 'Beklenmeyen bir hata oluştu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-content">
      <div className="module-intro">
        <p>
          Model roket uçuşlarında roket parametreleri ve çevresel koşullara göre tahmini yörünge,
          maksimum irtifa, uçuş süresi ve düşüş alanı analizi yapmak için tasarlanmıştır.
        </p>
      </div>

      <div className="workspace-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          {fieldGroups.map((group) => (
            <fieldset key={group.title}>
              <legend>{group.title}</legend>
              <div className="form-grid">
                {group.fields.map(([label, name, unit, min, max]) => (
                  <InputField
                    key={name}
                    label={label}
                    name={name}
                    unit={unit}
                    value={form[name]}
                    onChange={handleChange}
                    min={min}
                    max={max}
                  />
                ))}
              </div>
            </fieldset>
          ))}

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={loading || !isValid}>
            <Activity size={18} />
            {loading ? 'Çalıştırılıyor...' : 'Simülasyonu Çalıştır'}
          </button>
        </form>

        <aside className="results-column">
          <div className="panel">
            <h2>Analiz Sonuçları</h2>
            {result ? (
              <div className="result-grid">
                <ResultCard label="Mesafe" value={`${formatNumber(result.distance_m)} m`} />
                <ResultCard label="Azimuth" value={`${formatNumber(result.azimuth_deg)} deg`} />
                <ResultCard label="Uçuş süresi" value={`${formatNumber(result.flight_time_s, 2)} s`} />
                <ResultCard label="Maksimum irtifa" value={`${formatNumber(result.max_alt_m)} m`} />
                <ResultCard
                  label="Tahmini düşüş mesafesi"
                  value={`${formatNumber(result.impact_downrange_m)} m`}
                />
                <ResultCard
                  label="EN sapması"
                  value={`${formatNumber(result.impact_E)} E / ${formatNumber(result.impact_N)} N`}
                />
                <ResultCard label="Maksimum hız" value={`${formatNumber(result.max_speed_mps)} m/s`} />
              </div>
            ) : (
              <div className="empty-state">Simülasyon çıktıları burada listelenecek.</div>
            )}
          </div>

          <div className="panel map-placeholder">
            <Map size={28} />
            <h2>Güvenli Alan Görselleştirme</h2>
            <p>Leaflet entegrasyonu için ayrılmış düşüş alanı ve yörünge görselleştirme bölümü.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
