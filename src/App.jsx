import { useState, useCallback } from "react";
import Header from "./components/Header";
import LiveTicker from "./components/LiveTicker";
import StockChart from "./components/StockChart";
import Watchlist from "./components/Watchlist";
import Portfolio from "./components/Portfolio";
import { useFinnhubWebSocket } from "./hooks/useFinnhub";
import "./App.css";

const API_KEY = "d6t64fhr01qoqoisd2k0d6t64fhr01qoqoisd2kg";

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
      <Header />
      <LiveTicker apiKey={API_KEY} watchlist={portfolioItems} />

      <main className="main-content">
        <StockChart symbol={selectedSymbol} apiKey={API_KEY} />
        <Watchlist
          apiKey={API_KEY}
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
          apiKey={API_KEY}
          livePrices={livePrices}
          onSelect={setSelectedSymbol}
        />
      </main>
    </div>
  );
}
