import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModuleWorkspace({ category, module, children }) {
  return (
    <section className="module-workspace">
      <div className="workspace-toolbar">
        <div>
          <nav className="breadcrumb" aria-label="Konum">
            <Link to="/">Ana Panel</Link>
            <span>/</span>
            <Link to={`/category/${category.id}`}>{category.title}</Link>
            <span>/</span>
            <strong>{module.shortTitle}</strong>
          </nav>
          <h1>{module.title}</h1>
        </div>
        <Link className="secondary-button" to={`/category/${category.id}`}>
          <ChevronLeft size={18} />
          Modüllere Dön
        </Link>
      </div>

      {children}
    </section>
  );
}
