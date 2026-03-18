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

export const useFinnhubCandles = (symbol, apiKey) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol || !apiKey) return;
    const fetchCandles = async () => {
      setLoading(true);
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 60 * 60 * 24; // last 24h
        const res = await fetch(
          `${FINNHUB_API_BASE}/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${to}&token=${apiKey}`,
        );
        const json = await res.json();
        if (json.s === "ok" && json.c) {
          const formatted = json.t.map((time, i) => ({
            time: new Date(time * 1000).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            price: json.c[i],
            open: json.o[i],
            high: json.h[i],
            low: json.l[i],
            volume: json.v[i],
          }));
          setCandles(formatted);
        }
      } catch (err) {
        console.error("Candle fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandles();
  }, [symbol, apiKey]);

  return { candles, loading };
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
