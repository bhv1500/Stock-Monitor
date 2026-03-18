import { useState, useEffect } from 'react';
import { useFinnhubQuote } from '../hooks/useFinnhub';
import { formatPrice, formatChange, formatPercent } from '../utils/formatters';
import './StockCard.css';

export default function StockCard({ symbol, apiKey, onClick, isSelected, livePrice }) {
  const { data: quote, loading } = useFinnhubQuote(symbol, apiKey);
  const [flash, setFlash] = useState(null);
  const [prevLive, setPrevLive] = useState(null);

  useEffect(() => {
    if (livePrice && prevLive !== null && livePrice !== prevLive) {
      setFlash(livePrice > prevLive ? 'up' : 'down');
      setTimeout(() => setFlash(null), 500);
    }
    setPrevLive(livePrice);
  }, [livePrice]);

  const displayPrice = livePrice || quote?.c;
  const change = quote?.d;
  const changePercent = quote?.dp;
  const isPositive = change >= 0;

  return (
    <div
      className={`stock-card ${isSelected ? 'selected' : ''} ${flash ? `flash-${flash}` : ''}`}
      onClick={() => onClick(symbol)}
    >
      {loading && !quote ? (
        <div className="card-skeleton">
          <div className="sk sk-title" />
          <div className="sk sk-price" />
          <div className="sk sk-change" />
        </div>
      ) : (
        <>
          <div className="card-top">
            <span className="card-symbol">{symbol}</span>
            {livePrice && <span className="live-badge">LIVE</span>}
          </div>
          <div className="card-price">{formatPrice(displayPrice)}</div>
          <div className={`card-change ${isPositive ? 'pos' : 'neg'}`}>
            <span>{formatChange(change)}</span>
            <span className="card-pct">{formatPercent(changePercent)}</span>
          </div>
          <div className={`card-bar ${isPositive ? 'pos' : 'neg'}`} />
        </>
      )}
    </div>
  );
}
