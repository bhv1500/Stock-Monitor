import { useEffect, useRef, useState } from 'react';
import { useFinnhubWebSocket } from '../hooks/useFinnhub';
import { formatPrice, formatPercent } from '../utils/formatters';
import './LiveTicker.css';

const DEFAULT_TICKER_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META', 'SPY', 'QQQ', 'AMD'];

export default function LiveTicker({ apiKey, watchlist }) {
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [flash, setFlash] = useState({});

  const allSymbols = [...new Set([...DEFAULT_TICKER_SYMBOLS, ...watchlist.map((s) => s.symbol)])];

  useFinnhubWebSocket(allSymbols, apiKey, (trade) => {
    setPrices((prev) => {
      const prevPrice = prev[trade.s];
      if (prevPrice !== undefined && prevPrice !== trade.p) {
        setPrevPrices((pp) => ({ ...pp, [trade.s]: prevPrice }));
        setFlash((f) => ({ ...f, [trade.s]: trade.p > prevPrice ? 'up' : 'down' }));
        setTimeout(() => setFlash((f) => ({ ...f, [trade.s]: null })), 600);
      }
      return { ...prev, [trade.s]: trade.p };
    });
  });

  return (
    <div className="live-ticker-wrapper">
      <div className="live-dot" />
      <div className="ticker-scroll-container">
        <div className="ticker-track">
          {[...allSymbols, ...allSymbols].map((sym, i) => {
            const price = prices[sym];
            const prev = prevPrices[sym];
            const change = price && prev ? ((price - prev) / prev) * 100 : null;
            const flashDir = flash[sym];

            return (
              <span key={`${sym}-${i}`} className={`ticker-item ${flashDir ? `flash-${flashDir}` : ''}`}>
                <span className="ticker-sym">{sym}</span>
                <span className="ticker-price">{price ? formatPrice(price) : '---'}</span>
                {change !== null && (
                  <span className={`ticker-change ${change >= 0 ? 'pos' : 'neg'}`}>
                    {formatPercent(change)}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
