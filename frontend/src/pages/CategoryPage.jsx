import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ModuleGrid from '../components/ModuleGrid.jsx';
import { getCategory, getModulesByCategory } from '../data/modules.js';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const category = getCategory(categoryId);

  if (!category) {
    return <Navigate to="/" replace />;
  }

  const categoryModules = getModulesByCategory(category.id);
  const Icon = category.icon;

  return (
    <section className="category-page">
      <div className="section-toolbar">
        <Link className="secondary-button" to="/">
          <ChevronLeft size={18} />
          Ana Seçime Dön
        </Link>
      </div>

      <div className="category-heading">
        <div className="heading-icon">
          <Icon size={34} />
        </div>
        <div>
          <p className="eyebrow">Sistem kategorisi</p>
          <h1>{category.title}</h1>
          <p>{category.subtitle}</p>
        </div>
      </div>

      <ModuleGrid modules={categoryModules} />
    </section>
  );
}
