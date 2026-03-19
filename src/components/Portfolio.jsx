import { useState, useRef } from 'react';
import { ALL_SYMBOLS } from './Watchlist';
import { formatPrice, formatChange, formatPercent } from '../utils/formatters';
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import './Portfolio.css';

function PortfolioRow({ item, livePrices, portfolioQuotes, onDelete, onUpdate, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [editShares, setEditShares] = useState(item.shares);
  const [editAvgCost, setEditAvgCost] = useState(item.avgCost);

  // Use live WebSocket price first, then watchlist quote, then portfolio-specific quote
  const quote = portfolioQuotes[item.symbol];
  const currentPrice = livePrices[item.symbol] || quote?.c;
  const dailyChange = quote?.d;
  const dailyChangePct = quote?.dp;

  const marketValue = currentPrice && item.shares ? currentPrice * item.shares : null;
  const costBasis = item.avgCost && item.shares ? item.avgCost * item.shares : null;
  const gainLoss = marketValue && costBasis ? marketValue - costBasis : null;
  const gainLossPct = costBasis && gainLoss !== null ? (gainLoss / costBasis) * 100 : null;
  const isPositive = gainLoss !== null ? gainLoss >= 0 : dailyChange >= 0;

  const saveEdit = () => {
    onUpdate(item.id, { shares: parseFloat(editShares) || 0, avgCost: parseFloat(editAvgCost) || 0 });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditShares(item.shares);
    setEditAvgCost(item.avgCost);
    setEditing(false);
  };

  return (
    <div className={`portfolio-row ${item.completed ? 'completed' : ''}`}>
      <div className="pr-left">
        <button
          className={`pr-check ${item.completed ? 'checked' : ''}`}
          onClick={() => onUpdate(item.id, { completed: !item.completed })}
          title="Mark as reviewed"
        >
          {item.completed ? <FiCheck size={12} /> : null}
        </button>
        <div className="pr-info" onClick={() => onSelect(item.symbol)} style={{ cursor: 'pointer' }}>
          <span className="pr-symbol">{item.symbol}</span>
          <span className="pr-name">{item.name || item.symbol}</span>
        </div>
      </div>

      <div className="pr-mid">
        {editing ? (
          <div className="pr-edit-fields">
            <div className="pr-field">
              <label>Shares</label>
              <input
                type="number"
                value={editShares}
                onChange={(e) => setEditShares(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div className="pr-field">
              <label>Avg Cost</label>
              <input
                type="number"
                value={editAvgCost}
                onChange={(e) => setEditAvgCost(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        ) : (
          <div className="pr-position">
            {item.shares > 0 && (
              <>
                <span className="pr-shares">{item.shares} shares</span>
                {item.avgCost > 0 && (
                  <span className="pr-cost">@ {formatPrice(item.avgCost)}</span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="pr-right">
        {!editing && (
          <>
            <div className="pr-prices">
              <span className="pr-current">{formatPrice(currentPrice)}</span>
              {marketValue !== null && (
                <span className="pr-mval">{formatPrice(marketValue)}</span>
              )}
            </div>
            {gainLoss !== null ? (
              <div className={`pr-gain ${isPositive ? 'pos' : 'neg'}`}>
                {isPositive ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                <span>{formatChange(gainLoss)}</span>
                <span>({formatPercent(gainLossPct)})</span>
              </div>
            ) : dailyChange != null ? (
              <div className={`pr-gain ${dailyChange >= 0 ? 'pos' : 'neg'}`}>
                {dailyChange >= 0 ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                <span>{formatChange(dailyChange)}</span>
                <span>({formatPercent(dailyChangePct)})</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="pr-actions">
        {editing ? (
          <>
            <button className="pr-btn save" onClick={saveEdit} title="Save">
              <FiCheck size={14} />
            </button>
            <button className="pr-btn cancel" onClick={cancelEdit} title="Cancel">
              <FiX size={14} />
            </button>
          </>
        ) : (
          <>
            <button className="pr-btn edit" onClick={() => setEditing(true)} title="Edit position">
              <FiEdit2 size={13} />
            </button>
            <button className="pr-btn delete" onClick={() => onDelete(item.id)} title="Remove">
              <FiTrash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Portfolio({ apiKey, livePrices, portfolioQuotes, items, onItemsChange, onSelect }) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const saveItems = (next) => {
    onItemsChange(next);
    localStorage.setItem('portfolio', JSON.stringify(next));
  };

  const addItem = async () => {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    if (items.find((i) => i.symbol === sym)) {
      setError(`${sym} already in portfolio`);
      return;
    }
    setAdding(true);
    setError('');
    try {
      const res = await fetch(`https://finnhub.io/api/v1/search?q=${sym}&token=${apiKey}`);
      const json = await res.json();
      const match = json.result?.find((r) => r.symbol === sym) || json.result?.[0];
      const newItem = {
        id: Date.now(),
        symbol: sym,
        name: match?.description || sym,
        shares: 0,
        avgCost: 0,
        completed: false,
        addedAt: new Date().toISOString(),
      };
      saveItems([...items, newItem]);
      setInput('');
    } catch {
      setError('Failed to add — check your API key');
    } finally {
      setAdding(false);
    }
  };

  const deleteItem = (id) => saveItems(items.filter((i) => i.id !== id));
  const updateItem = (id, patch) => saveItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  // Build a merged quotes map: watchlist symbols come from livePrices + portfolioQuotes
  const allQuotes = { ...portfolioQuotes };

  const totalValue = items.reduce((sum, item) => {
    const price = livePrices[item.symbol] || allQuotes[item.symbol]?.c;
    if (price && item.shares) return sum + price * item.shares;
    return sum;
  }, 0);

  const totalCost = items.reduce((sum, item) => {
    if (item.avgCost && item.shares) return sum + item.avgCost * item.shares;
    return sum;
  }, 0);

  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost ? (totalGain / totalCost) * 100 : 0;

  const pending = items.filter((i) => !i.completed);
  const reviewed = items.filter((i) => i.completed);

  return (
    <div className="portfolio">
      <div className="portfolio-header">
        <div>
          <h2>My Portfolio</h2>
          <p className="portfolio-sub">Track your stocks & ETFs</p>
        </div>
        {totalValue > 0 && (
          <div className="portfolio-total">
            <span className="total-value">{formatPrice(totalValue)}</span>
            {totalCost > 0 && (
              <span className={`total-gain ${totalGain >= 0 ? 'pos' : 'neg'}`}>
                {formatChange(totalGain)} ({formatPercent(totalGainPct)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="portfolio-add">
        <div className="add-input-wrap">
          <span className="add-prefix">$</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Add ticker symbol (e.g. AAPL, SPY)"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            maxLength={10}
          />
          <button className="add-btn" onClick={addItem} disabled={!input.trim() || adding}>
            {adding ? <span className="add-spinner" /> : <FiPlus size={16} />}
          </button>
        </div>
        {error && <span className="add-error">{error}</span>}
      </div>

      {items.length === 0 ? (
        <div className="portfolio-empty">
          <span className="empty-icon">📋</span>
          <p>Your portfolio is empty</p>
          <p className="empty-sub">Add ticker symbols to track stocks & ETFs</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="portfolio-section">
              <div className="section-label">Watching ({pending.length})</div>
              <div className="portfolio-list">
                {pending.map((item) => (
                  <PortfolioRow
                    key={item.id}
                    item={item}
                    livePrices={livePrices}
                    portfolioQuotes={allQuotes}
                    onDelete={deleteItem}
                    onUpdate={updateItem}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          )}
          {reviewed.length > 0 && (
            <div className="portfolio-section">
              <div className="section-label reviewed-label">Reviewed ({reviewed.length})</div>
              <div className="portfolio-list">
                {reviewed.map((item) => (
                  <PortfolioRow
                    key={item.id}
                    item={item}
                    livePrices={livePrices}
                    portfolioQuotes={allQuotes}
                    onDelete={deleteItem}
                    onUpdate={updateItem}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
