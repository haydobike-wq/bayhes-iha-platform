import React from 'react';
import { Calculator, Rocket, Plane } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand" aria-label="Ana sayfa">
        <Calculator size={22} />
        <span>Avionix AR-GE</span>
      </NavLink>
      <nav className="nav-links" aria-label="Ana navigasyon">
        <NavLink to="/bayhes">
          <Rocket size={18} />
          <span>BAYHES</span>
        </NavLink>
        <NavLink to="/iha">
          <Plane size={18} />
          <span>İHA</span>
        </NavLink>
      </nav>
    </header>
  );
}
