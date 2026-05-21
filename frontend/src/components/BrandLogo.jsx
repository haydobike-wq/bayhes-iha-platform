import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export default function BrandLogo({ compact = false }) {
  const [hasLogo, setHasLogo] = useState(true);

  return (
    <span className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`}>
      {hasLogo ? (
        <img src="/assets/logo.png" alt="Avionix Aerospace Team logosu" onError={() => setHasLogo(false)} />
      ) : (
        <span className="brand-logo__fallback" aria-hidden="true">
          <Shield size={compact ? 18 : 24} />
        </span>
      )}
    </span>
  );
}
