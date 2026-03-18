import { useState } from 'react';
import StockCard from './StockCard';
import './Watchlist.css';

const DEFAULT_WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'SPY', 'QQQ', 'AMD'];

export default function Watchlist({ apiKey, onSelect, selectedSymbol, livePrices }) {
  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h2>Market</h2>
        <span className="watchlist-count">{DEFAULT_WATCHLIST.length} stocks</span>
      </div>
      <div className="watchlist-grid">
        {DEFAULT_WATCHLIST.map((sym) => (
          <StockCard
            key={sym}
            symbol={sym}
            apiKey={apiKey}
            onClick={onSelect}
            isSelected={selectedSymbol === sym}
            livePrice={livePrices[sym]}
          />
        ))}
      </div>
    </div>
  );
}
