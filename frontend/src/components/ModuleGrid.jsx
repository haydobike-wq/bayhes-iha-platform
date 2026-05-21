import React from 'react';
import ModuleCard from './ModuleCard.jsx';

export default function ModuleGrid({ modules }) {
  return (
    <section className="module-grid" aria-label="Sistem modülleri">
      {modules.map((module) => (
        <ModuleCard module={module} key={module.id} />
      ))}
    </section>
  );
}
