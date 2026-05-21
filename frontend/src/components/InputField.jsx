import React from 'react';

export default function InputField({ label, name, value, onChange, min, max, step = 'any', unit }) {
  return (
    <label className="input-field">
      <span>
        {label}
        {unit ? <em>{unit}</em> : null}
      </span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        required
      />
    </label>
  );
}
