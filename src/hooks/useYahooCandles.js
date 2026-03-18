import { useState, useEffect } from 'react';

// corsproxy.io is a free CORS proxy — needed because Yahoo Finance blocks direct browser requests
const CORS_PROXY = 'https://corsproxy.io/?url=';

const YAHOO_RANGES = [
  { range: '5d',  interval: '30m', label: '5D', timeFormat: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } },
  { range: '1mo', interval: '1d',  label: '1M', timeFormat: { month: 'short', day: 'numeric' } },
  { range: '3mo', interval: '1d',  label: '3M', timeFormat: { month: 'short', day: 'numeric' } },
  { range: '6mo', interval: '1wk', label: '6M', timeFormat: { month: 'short', day: 'numeric' } },
];

const parseResult = (json, timeFormat) => {
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0];
  if (!timestamps || !quote?.close || timestamps.length < 2) return null;

  const formatted = timestamps
    .map((t, i) => ({
      time: new Date(t * 1000).toLocaleString('en-US', timeFormat),
      price: quote.close[i],
      open: quote.open?.[i],
      high: quote.high?.[i],
      low: quote.low?.[i],
      volume: quote.volume?.[i],
    }))
    .filter((c) => c.price != null && !isNaN(c.price));

  return formatted.length >= 2 ? formatted : null;
};

export const useYahooCandles = (symbol, enabled) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('');

  useEffect(() => {
    if (!symbol || !enabled) {
      setCandles([]);
      return;
    }

    let cancelled = false;

    const fetchYahoo = async () => {
      setLoading(true);
      setCandles([]);
      setRangeLabel('');

      for (const attempt of YAHOO_RANGES) {
        if (cancelled) break;

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${attempt.interval}&range=${attempt.range}&includePrePost=false&corsDomain=finance.yahoo.com`;

        // Try direct first, then via CORS proxy
        const urls = [yahooUrl, `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`];

        for (const url of urls) {
          if (cancelled) break;
          try {
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!res.ok) continue;

            const json = await res.json();
            const formatted = parseResult(json, attempt.timeFormat);
            if (!formatted) continue;

            if (!cancelled) {
              setCandles(formatted);
              setRangeLabel(attempt.label);
            }
            return;
          } catch (err) {
            console.warn(`Yahoo chart fetch failed [${attempt.range}]:`, err.message);
          }
        }
      }

      if (!cancelled) {
        setCandles([]);
        setRangeLabel('');
      }
    };

    fetchYahoo().finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, enabled]);

  return { candles, loading, rangeLabel };
};
