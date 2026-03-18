import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinnhubCandles, useFinnhubQuote } from '../hooks/useFinnhub';
import { useYahooCandles } from '../hooks/useYahooCandles';
import { formatPrice, formatChange, formatPercent } from '../utils/formatters';
import './StockChart.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <span>{formatPrice(payload[0].value)}</span>
        <span className="tooltip-time">{payload[0].payload.time}</span>
      </div>
    );
  }
  return null;
};

export default function StockChart({ symbol, apiKey }) {
  const { candles: finnhubCandles, loading: finnhubLoading, rangeLabel: finnhubLabel } = useFinnhubCandles(symbol, apiKey);
  const { data: quote } = useFinnhubQuote(symbol, apiKey);

  // Use Yahoo Finance as fallback when Finnhub returns no candles
  const finnhubDone = !finnhubLoading;
  const needsYahoo = finnhubDone && finnhubCandles.length === 0;
  const { candles: yahooCandles, loading: yahooLoading, rangeLabel: yahooLabel } = useYahooCandles(symbol, needsYahoo);

  const candles = finnhubCandles.length > 0 ? finnhubCandles : yahooCandles;
  const rangeLabel = finnhubCandles.length > 0 ? finnhubLabel : yahooLabel;
  const isYahoo = finnhubCandles.length === 0 && yahooCandles.length > 0;
  const loading = finnhubLoading || (needsYahoo && yahooLoading);

  const isPositive = quote ? quote.d >= 0 : true;
  const color = isPositive ? '#00c805' : '#ff5000';

  const minPrice = candles.length ? Math.min(...candles.map((c) => c.price)) * 0.998 : 0;
  const maxPrice = candles.length ? Math.max(...candles.map((c) => c.price)) * 1.002 : 100;

  return (
    <div className="stock-chart-card">
      <div className="chart-header">
        <div className="chart-symbol-block">
          <h1 className="chart-symbol">{symbol}</h1>
          {quote && (
            <>
              <span className="chart-price">{formatPrice(quote.c)}</span>
              <span className={`chart-change ${isPositive ? 'pos' : 'neg'}`}>
                {formatChange(quote.d)} ({formatPercent(quote.dp)})
              </span>
            </>
          )}
        </div>
        {quote && (
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">Open</span>
              <span className="stat-value">{formatPrice(quote.o)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High</span>
              <span className="stat-value">{formatPrice(quote.h)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low</span>
              <span className="stat-value">{formatPrice(quote.l)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Prev Close</span>
              <span className="stat-value">{formatPrice(quote.pc)}</span>
            </div>
          </div>
        )}
      </div>

      {rangeLabel && (
        <div className="chart-range-note">
          {isYahoo
            ? `Past ${rangeLabel} · Historical data via Yahoo Finance`
            : rangeLabel !== '1D'
            ? `Showing ${rangeLabel} · Intraday unavailable (market closed)`
            : null}
        </div>
      )}

      <div className="chart-area">
        {loading ? (
          <div className="chart-loading">
            <span className="chart-spinner" /> Loading chart...
          </div>
        ) : candles.length === 0 ? (
          <div className="chart-loading">No chart data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={candles} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: '#555', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fill: '#555', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
