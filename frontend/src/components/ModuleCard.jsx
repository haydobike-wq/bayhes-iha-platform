import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

export default function ModuleCard({ module }) {
  const Icon = module.icon;

  return (
    <Link className="module-card" to={`/module/${module.categoryId}/${module.id}`}>
      <div className="module-card__top">
        <span className="module-card__icon">
          <Icon size={24} />
        </span>
        <StatusBadge tone={module.statusTone}>{module.status}</StatusBadge>
      </div>
      <div>
        <h2>{module.title}</h2>
        <p>{module.description}</p>
      </div>
      <span className="module-card__action">
        Aç
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}
