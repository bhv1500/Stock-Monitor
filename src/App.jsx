import { useState, useCallback } from 'react';
import Header from './components/Header';
import LiveTicker from './components/LiveTicker';
import StockChart from './components/StockChart';
import Watchlist from './components/Watchlist';
import Portfolio from './components/Portfolio';
import ApiKeyModal from './components/ApiKeyModal';
import { useFinnhubWebSocket } from './hooks/useFinnhub';
import './App.css';

const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'SPY', 'QQQ', 'AMD'];

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('finnhub_api_key') || '');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [livePrices, setLivePrices] = useState({});
  const [portfolioItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('portfolio') || '[]'); } catch { return []; }
  });

  const allSymbols = [...new Set([...DEFAULT_SYMBOLS, ...portfolioItems.map((i) => i.symbol)])];

  useFinnhubWebSocket(allSymbols, apiKey, useCallback((trade) => {
    setLivePrices((prev) => ({ ...prev, [trade.s]: trade.p }));
  }, []));

  const saveApiKey = (key) => {
    localStorage.setItem('finnhub_api_key', key);
    setApiKey(key);
  };

  const resetKey = () => {
    localStorage.removeItem('finnhub_api_key');
    setApiKey('');
  };

  if (!apiKey) {
    return <ApiKeyModal onSave={saveApiKey} />;
  }

  return (
    <div className="app">
      <Header onResetKey={resetKey} />
      <LiveTicker apiKey={apiKey} watchlist={portfolioItems} />

      <main className="main-content">
        <StockChart symbol={selectedSymbol} apiKey={apiKey} />
        <Watchlist
          apiKey={apiKey}
          onSelect={setSelectedSymbol}
          selectedSymbol={selectedSymbol}
          livePrices={livePrices}
        />

        <div className="section-divider">
          <div className="divider-line" />
          <span className="divider-text">Portfolio Tracker</span>
          <div className="divider-line" />
        </div>

        <Portfolio
          apiKey={apiKey}
          livePrices={livePrices}
          onSelect={setSelectedSymbol}
        />
      </main>
    </div>
  );
}
