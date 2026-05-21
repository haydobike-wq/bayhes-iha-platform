import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CategorySelector({ categories }) {
  return (
    <section className="category-selector" aria-label="Sistem kategorileri">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link className={`category-card category-card--${category.accent}`} to={`/category/${category.id}`} key={category.id}>
            <div className="category-card__icon">
              <Icon size={34} />
            </div>
            <div>
              <h2>{category.title}</h2>
              <p>{category.subtitle}</p>
            </div>
            <span className="category-card__action">
              Seç
              <ArrowRight size={18} />
            </span>
          </Link>
        );
      })}
    </section>
  );
}
