import './Header.css';

export default function Header({ activeSection, onNav }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="brand-icon">📈</span>
          <span className="brand-name">StockMonitor</span>
        </div>

        <nav className="header-nav">
          <span
            className={`nav-item ${activeSection === 'markets' ? 'active' : ''}`}
            onClick={() => onNav('markets')}
          >
            Markets
          </span>
          <span
            className={`nav-item ${activeSection === 'portfolio' ? 'active' : ''}`}
            onClick={() => onNav('portfolio')}
          >
            Portfolio
          </span>
        </nav>
      </div>
    </header>
  );
}
