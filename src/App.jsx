import { useState, useCallback, useRef, useEffect } from "react";
import Header from "./components/Header";
import LiveTicker from "./components/LiveTicker";
import StockChart from "./components/StockChart";
import Watchlist, { ALL_SYMBOLS } from "./components/Watchlist";
import Portfolio from "./components/Portfolio";
import { useFinnhubWebSocket } from "./hooks/useFinnhub";
import "./App.css";

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [livePrices, setLivePrices] = useState({});
  const [portfolioQuotes, setPortfolioQuotes] = useState({});
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("markets");
  const portfolioRef = useRef(null);
  const marketsRef = useRef(null);

  const [portfolioItems, setPortfolioItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("portfolio") || "[]");
    } catch {
      return [];
    }
  });

  const handleNav = (section) => {
    setActiveSection(section);
    if (section === 'portfolio') {
      portfolioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      marketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const allSymbols = [
    ...new Set([...ALL_SYMBOLS, ...portfolioItems.map((i) => i.symbol)]),
  ];

  // Single centralized quote fetch for ALL symbols — avoids rate limiting from individual component fetches
  useEffect(() => {
    if (!API_KEY) return;

    const fetchAllQuotes = async () => {
      setQuotesLoading(true);
      const chunks = [];
      for (let i = 0; i < allSymbols.length; i += 10) {
        chunks.push(allSymbols.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map((sym) =>
            fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`)
              .then((r) => r.json())
              .then((data) => ({ sym, data }))
          )
        );
        const next = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.data?.c) {
            next[r.value.sym] = r.value.data;
          }
        });
        setPortfolioQuotes((prev) => ({ ...prev, ...next }));
        if (chunks.length > 1) await new Promise((res) => setTimeout(res, 1000));
      }
      setQuotesLoading(false);
    };

    fetchAllQuotes();
    const interval = setInterval(fetchAllQuotes, 60000);
    return () => clearInterval(interval);
  }, [allSymbols.join(',')]);

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
        <StockChart symbol={selectedSymbol} apiKey={API_KEY} quote={portfolioQuotes[selectedSymbol]} />
        <Watchlist
          quotes={portfolioQuotes}
          onSelect={setSelectedSymbol}
          selectedSymbol={selectedSymbol}
          livePrices={livePrices}
          loading={quotesLoading}
        />

        <div ref={portfolioRef} className="section-divider">
          <div className="divider-line" />
          <span className="divider-text">Portfolio Tracker</span>
          <div className="divider-line" />
        </div>

        <Portfolio
          apiKey={API_KEY}
          livePrices={livePrices}
          portfolioQuotes={portfolioQuotes}
          items={portfolioItems}
          onItemsChange={setPortfolioItems}
          onSelect={setSelectedSymbol}
        />
      </main>
    </div>
  );
}
