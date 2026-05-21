import React, { useState } from 'react';

export default function AssetImage({ src, alt, className = '', fallbackLabel }) {
  const [loaded, setLoaded] = useState(true);

  if (!loaded) {
    return (
      <div className={`asset-fallback ${className}`} role="img" aria-label={alt}>
        <span>{fallbackLabel || alt}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setLoaded(false)} />;
}
