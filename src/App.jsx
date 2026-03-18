import { useState, useCallback, useRef } from "react";
import Header from "./components/Header";
import LiveTicker from "./components/LiveTicker";
import StockChart from "./components/StockChart";
import Watchlist from "./components/Watchlist";
import Portfolio from "./components/Portfolio";
import { useFinnhubWebSocket } from "./hooks/useFinnhub";
import "./App.css";

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

const DEFAULT_SYMBOLS = [
  "AAPL",
  "TSLA",
  "NVDA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "SPY",
  "QQQ",
  "AMD",
];

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [livePrices, setLivePrices] = useState({});
  const [activeSection, setActiveSection] = useState("markets");
  const portfolioRef = useRef(null);
  const marketsRef = useRef(null);

  const handleNav = (section) => {
    setActiveSection(section);
    if (section === 'portfolio') {
      portfolioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const [portfolioItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("portfolio") || "[]");
    } catch {
      return [];
    }
  });

  const allSymbols = [
    ...new Set([...DEFAULT_SYMBOLS, ...portfolioItems.map((i) => i.symbol)]),
  ];

  useFinnhubWebSocket(
    allSymbols,
    API_KEY,
    useCallback((trade) => {
      setLivePrices((prev) => ({ ...prev, [trade.s]: trade.p }));
    }, []),
  );

  return (
    <div className="app">
      <Header activeSection={activeSection} onNav={handleNav} />
      <LiveTicker apiKey={API_KEY} watchlist={portfolioItems} />

      <main className="main-content">
        <div ref={marketsRef} />
        <StockChart symbol={selectedSymbol} apiKey={API_KEY} />
        <Watchlist
          apiKey={API_KEY}
          onSelect={setSelectedSymbol}
          selectedSymbol={selectedSymbol}
          livePrices={livePrices}
        />

        <div ref={portfolioRef} className="section-divider">
          <div className="divider-line" />
          <span className="divider-text">Portfolio Tracker</span>
          <div className="divider-line" />
        </div>

        <Portfolio
          apiKey={API_KEY}
          livePrices={livePrices}
          onSelect={setSelectedSymbol}
        />
      </main>
    </div>
  );
}
