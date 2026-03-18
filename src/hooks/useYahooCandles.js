import { useState, useEffect } from 'react';

// Multiple CORS proxies as fallbacks in case one is down
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

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

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${attempt.interval}&range=${attempt.range}&includePrePost=false`;

        // On localhost try direct first; on deployed always go straight to proxies
        const urlsToTry = isLocalhost
          ? [yahooUrl, ...CORS_PROXIES.map((p) => p(yahooUrl))]
          : CORS_PROXIES.map((p) => p(yahooUrl));

        for (const url of urlsToTry) {
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
            console.warn(`Chart fetch failed [${attempt.range}] via ${url.slice(0, 40)}:`, err.message);
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
