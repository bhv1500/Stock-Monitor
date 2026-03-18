import { useState, useEffect, useRef, useCallback } from "react";

const FINNHUB_API_BASE = "https://finnhub.io/api/v1";

export const useFinnhubQuote = (symbol, apiKey) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuote = useCallback(async () => {
    if (!symbol || !apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${FINNHUB_API_BASE}/quote?symbol=${symbol}&token=${apiKey}`,
      );
      if (!res.ok) throw new Error("Failed to fetch quote");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, apiKey]);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 15000);
    return () => clearInterval(interval);
  }, [fetchQuote]);

  return { data, loading, error, refetch: fetchQuote };
};

const CANDLE_ATTEMPTS = [
  { label: '1D', resolution: '5',  seconds: 60 * 60 * 24,      timeFormat: { hour: '2-digit', minute: '2-digit' } },
  { label: '1W', resolution: '60', seconds: 60 * 60 * 24 * 7,  timeFormat: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } },
  { label: '1M', resolution: 'D',  seconds: 60 * 60 * 24 * 30, timeFormat: { month: 'short', day: 'numeric' } },
  { label: '3M', resolution: 'D',  seconds: 60 * 60 * 24 * 90, timeFormat: { month: 'short', day: 'numeric' } },
];

export const useFinnhubCandles = (symbol, apiKey) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('');

  useEffect(() => {
    if (!symbol || !apiKey) return;
    setCandles([]);
    const fetchCandles = async () => {
      setLoading(true);
      try {
        const to = Math.floor(Date.now() / 1000);
        for (const attempt of CANDLE_ATTEMPTS) {
          const from = to - attempt.seconds;
          const res = await fetch(
            `${FINNHUB_API_BASE}/stock/candle?symbol=${symbol}&resolution=${attempt.resolution}&from=${from}&to=${to}&token=${apiKey}`,
          );
          const json = await res.json();
          if (json.s === 'ok' && json.c && json.c.length > 1) {
            const formatted = json.t.map((time, i) => ({
              time: new Date(time * 1000).toLocaleString('en-US', attempt.timeFormat),
              price: json.c[i],
              open: json.o[i],
              high: json.h[i],
              low: json.l[i],
              volume: json.v[i],
            }));
            setCandles(formatted);
            setRangeLabel(attempt.label);
            return;
          }
        }
        // All attempts exhausted — no data
        setCandles([]);
        setRangeLabel('');
      } catch (err) {
        console.error('Candle fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandles();
  }, [symbol, apiKey]);

  return { candles, loading, rangeLabel };
};

export const useFinnhubWebSocket = (symbols, apiKey, onTrade) => {
  const wsRef = useRef(null);
  const subscribedRef = useRef(new Set());

  useEffect(() => {
    if (!apiKey || !symbols.length) return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
      wsRef.current = ws;

      ws.onopen = () => {
        symbols.forEach((s) => {
          if (!subscribedRef.current.has(s)) {
            ws.send(JSON.stringify({ type: "subscribe", symbol: s }));
            subscribedRef.current.add(s);
          }
        });
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "trade" && msg.data) {
          msg.data.forEach((trade) => onTrade(trade));
        }
      };

      ws.onerror = () => ws.close();
      ws.onclose = () => {
        subscribedRef.current.clear();
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
        subscribedRef.current.clear();
      }
    };
  }, [symbols.join(","), apiKey]);
};
