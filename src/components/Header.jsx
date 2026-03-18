import { useState } from 'react';
import { FiSettings, FiRefreshCw } from 'react-icons/fi';
import './Header.css';

export default function Header({ onResetKey }) {
  const [showMenu, setShowMenu] = useState(false);

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

        <div className="header-right">
          <button
            className="header-btn"
            onClick={() => setShowMenu((v) => !v)}
            title="Settings"
          >
            <FiSettings size={16} />
          </button>
          {showMenu && (
            <div className="settings-dropdown">
              <button
                className="settings-item"
                onClick={() => { onResetKey(); setShowMenu(false); }}
              >
                <FiRefreshCw size={13} />
                Change API Key
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
