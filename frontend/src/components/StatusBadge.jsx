import React from 'react';

export default function StatusBadge({ tone = 'demo', children }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}
