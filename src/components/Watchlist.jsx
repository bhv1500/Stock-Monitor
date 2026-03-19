import StockCard from './StockCard';
import './Watchlist.css';

const CATEGORIES = [
  {
    label: 'Mega Cap Tech',
    symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'],
  },
  {
    label: 'Technology',
    symbols: ['AMD', 'NFLX', 'ADBE', 'UBER'],
  },
  {
    label: 'Finance',
    symbols: ['JPM', 'V', 'BAC'],
  },
  {
    label: 'Healthcare',
    symbols: ['JNJ', 'UNH', 'PFE'],
  },
  {
    label: 'ETFs',
    symbols: ['SPY', 'QQQ', 'IWM', 'GLD', 'VTI'],
  },
];

export const ALL_SYMBOLS = CATEGORIES.flatMap((c) => c.symbols);

export default function Watchlist({ quotes, onSelect, selectedSymbol, livePrices, loading }) {
  return (
    <div className="watchlist">
      {loading && (
        <div className="watchlist-loading-note">
          <span className="watchlist-loading-spinner" />
          Fetching market data for all stocks — please wait a moment...
        </div>
      )}
      {CATEGORIES.map((cat) => (
        <div key={cat.label} className="watchlist-category">
          <div className="watchlist-header">
            <h2>{cat.label}</h2>
            <span className="watchlist-count">{cat.symbols.length} symbols</span>
          </div>
          <div className="watchlist-grid">
            {cat.symbols.map((sym) => (
              <StockCard
                key={sym}
                symbol={sym}
                quote={quotes[sym]}
                onClick={onSelect}
                isSelected={selectedSymbol === sym}
                livePrice={livePrices[sym]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
