import React from 'react';

export default function ResultCard({ label, value, helper, tone = 'default' }) {
  return (
    <article className={`result-card result-card--${tone}`}>
      <span className="result-label">{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}
