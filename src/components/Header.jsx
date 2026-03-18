import { useState } from 'react';
import { FiSettings, FiRefreshCw } from 'react-icons/fi';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="brand-icon">📈</span>
          <span className="brand-name">StockMonitor</span>
        </div>

        <nav className="header-nav">
          <span className="nav-item active">Markets</span>
          <span className="nav-item">Portfolio</span>
        </nav>
      </div>
    </header>
  );
}
