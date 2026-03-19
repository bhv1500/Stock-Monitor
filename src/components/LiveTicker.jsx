import { useEffect, useState } from 'react';
import { useFinnhubWebSocket } from '../hooks/useFinnhub';
import { formatPrice, formatPercent, formatChange } from '../utils/formatters';
import './LiveTicker.css';

const DEFAULT_TICKER_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA',
  'AMD', 'NFLX', 'ADBE', 'UBER',
  'JPM', 'V', 'BAC',
  'JNJ', 'UNH', 'PFE',
  'SPY', 'QQQ', 'IWM', 'GLD', 'VTI',
];

export default function LiveTicker({ apiKey, watchlist }) {
  const [quotes, setQuotes] = useState({});   // { SYM: { price, change, changePercent } }
  const [flash, setFlash] = useState({});

  const allSymbols = [...new Set([...DEFAULT_TICKER_SYMBOLS, ...watchlist.map((s) => s.symbol)])];
  const hasData = Object.keys(quotes).length > 0;

  // Fetch initial REST quotes for all symbols
  useEffect(() => {
    if (!apiKey) return;
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        allSymbols.map((sym) =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`)
            .then((r) => r.json())
            .then((data) => ({ sym, price: data.c, change: data.d, changePercent: data.dp }))
        )
      );
      const next = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.price) {
          next[r.value.sym] = {
            price: r.value.price,
            change: r.value.change,
            changePercent: r.value.changePercent,
          };
        }
      });
      setQuotes(next);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [apiKey, allSymbols.join(',')]);

  // WebSocket updates override price in real-time
  useFinnhubWebSocket(allSymbols, apiKey, (trade) => {
    setQuotes((prev) => {
      const existing = prev[trade.s];
      if (existing && existing.price !== trade.p) {
        setFlash((f) => ({ ...f, [trade.s]: trade.p > existing.price ? 'up' : 'down' }));
        setTimeout(() => setFlash((f) => ({ ...f, [trade.s]: null })), 600);
      }
      return {
        ...prev,
        [trade.s]: {
          ...existing,
          price: trade.p,
        },
      };
    });
  });

  return (
    <>
    <div className="live-ticker-wrapper">
      <div className="live-dot" />
      <div className="ticker-scroll-container">
        <div className="ticker-track">
          {[...allSymbols, ...allSymbols].map((sym, i) => {
            const q = quotes[sym];
            const flashDir = flash[sym];
            const isPos = q?.changePercent >= 0;

            return (
              <span key={`${sym}-${i}`} className={`ticker-item ${flashDir ? `flash-${flashDir}` : ''}`}>
                <span className="ticker-sym">{sym}</span>
                <span className="ticker-price">{q ? formatPrice(q.price) : '···'}</span>
                {q?.changePercent != null && (
                  <span className={`ticker-change ${isPos ? 'pos' : 'neg'}`}>
                    {formatPercent(q.changePercent)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
    {!hasData && (
      <div className="ticker-loading-note">
        ⏳ Fetching live market data — this may take a few seconds...
      </div>
    )}
    </>
  );
}
