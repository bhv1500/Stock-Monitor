# StockMonitor

A real-time stock market dashboard built with React, inspired by the Robinhood UI. Displays live price tickers, interactive charts, and a personal portfolio tracker — all powered by the Finnhub API.

![StockMonitor Preview](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Live scrolling ticker** — WebSocket-powered price feed that flashes green/red on every trade
- **Interactive price chart** — Area chart for any selected stock, with a smart fallback chain: intraday (Finnhub) → historical (Yahoo Finance via CORS proxy)
- **Market watchlist** — Grid of stock cards showing real-time price, daily change, and percentage
- **Portfolio tracker** — Todo-style list where you add tickers, enter share count and average cost, and see live P&L calculated automatically
- **Robinhood-inspired dark UI** — `#0a0a0a` background, `#00c805` green, `#ff5000` red

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (no TypeScript) |
| Build tool | Vite 8 |
| Charts | Recharts |
| Icons | react-icons |
| Realtime data | Finnhub WebSocket API |
| Historical data | Yahoo Finance (via corsproxy.io) |
| Styling | Plain CSS Modules |

---

## React Concepts Used

### Hooks

#### `useState`
Used extensively to manage local component state — selected symbol, live prices map, portfolio items list, flash animations, and loading/error states.

```jsx
const [livePrices, setLivePrices] = useState({});
const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
```

#### `useEffect`
Drives all side effects: fetching REST quotes on mount, polling on intervals, opening/closing WebSocket connections, and fetching candle data when the selected symbol changes.

```jsx
useEffect(() => {
  fetchQuote();
  const interval = setInterval(fetchQuote, 15000);
  return () => clearInterval(interval); // cleanup on unmount
}, [fetchQuote]);
```

#### `useCallback`
Memoises the WebSocket `onTrade` handler in `App.jsx` so it does not trigger unnecessary re-subscriptions when the parent re-renders.

```jsx
useFinnhubWebSocket(allSymbols, API_KEY, useCallback((trade) => {
  setLivePrices((prev) => ({ ...prev, [trade.s]: trade.p }));
}, []));
```

#### `useRef`
Used in two ways:
1. Holds the live `WebSocket` instance without triggering re-renders when it reconnects
2. Holds DOM refs for the `markets` and `portfolio` sections to enable smooth scrolling from the nav

```jsx
const wsRef = useRef(null);
const portfolioRef = useRef(null);
portfolioRef.current?.scrollIntoView({ behavior: 'smooth' });
```

### Custom Hooks

All data-fetching logic is extracted into reusable custom hooks under `src/hooks/`:

| Hook | Purpose |
|---|---|
| `useFinnhubQuote(symbol, apiKey)` | Polls the Finnhub `/quote` endpoint every 15 seconds |
| `useFinnhubCandles(symbol, apiKey)` | Fetches OHLCV candle data, falling back through 1D → 1W → 1M → 3M ranges |
| `useFinnhubWebSocket(symbols, apiKey, onTrade)` | Opens a persistent WebSocket, subscribes to symbols, auto-reconnects on drop |
| `useYahooCandles(symbol, enabled)` | Fetches historical chart data from Yahoo Finance when Finnhub candles are unavailable |

Custom hooks follow React's convention of composing built-in hooks (`useState`, `useEffect`, `useRef`) into a single encapsulated interface, keeping components clean and focused purely on rendering.

### Lifting State Up

`livePrices` is managed at the top-level `App` component and passed down to `LiveTicker`, `Watchlist`, and `Portfolio`. This single source of truth means all components react to the same WebSocket stream without duplicating subscriptions.

### Conditional Rendering

Components like `StockChart` and `StockCard` handle multiple render states — loading skeleton, error, empty data, and populated data — using inline conditional expressions:

```jsx
{loading ? <Spinner /> : candles.length === 0 ? <EmptyState /> : <Chart />}
```

### Controlled Inputs

The portfolio add field and position edit inputs are fully controlled — `value` is bound to state and `onChange` updates it — giving instant validation (e.g. duplicate ticker detection, uppercase forcing) on every keystroke.

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx          # Sticky nav with section scroll
│   ├── LiveTicker.jsx      # Scrolling real-time price bar
│   ├── StockChart.jsx      # Area chart with Finnhub + Yahoo fallback
│   ├── StockCard.jsx       # Individual stock price card
│   ├── Watchlist.jsx       # Market grid layout
│   └── Portfolio.jsx       # Todo-style portfolio tracker
├── hooks/
│   ├── useFinnhub.js       # Quote, candles, and WebSocket hooks
│   └── useYahooCandles.js  # Yahoo Finance historical data hook
├── utils/
│   └── formatters.js       # Currency, percent, volume formatters
├── App.jsx                 # Root component — state, layout, navigation
└── index.css               # Global reset and scrollbar styles
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free Finnhub API key from [finnhub.io](https://finnhub.io) (no credit card required)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/stock-monitor.git
cd stock-monitor
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
VITE_FINNHUB_API_KEY=your_api_key_here
```

> The `VITE_` prefix is required by Vite to expose environment variables to the client bundle.

### Running locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for production

```bash
npm run build
```

Output is written to `dist/` and can be served from any static host.

---

## Deployment (Azure Static Web Apps)

This app is a fully static SPA — no server required. Recommended host: **Azure Static Web Apps** (free tier, no expiry).

1. Push the repo to GitHub
2. In the Azure Portal, create a **Static Web App** and link it to your repo
3. Set build preset to **Vite**, app location `/`, output location `dist`
4. Add `VITE_FINNHUB_API_KEY` under **Configuration → Application settings**
5. Azure automatically deploys on every `git push`

---

## Data Sources

| Source | Usage | Auth |
|---|---|---|
| [Finnhub](https://finnhub.io) | Live quotes, WebSocket trades, intraday candles | API key (free) |
| [Yahoo Finance](https://finance.yahoo.com) | Historical OHLCV candles (fallback) | None |

---

## License

MIT
