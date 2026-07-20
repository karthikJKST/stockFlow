# StockFlow — Market Intelligence Dashboard

A real-time stock market tracking and simulated trading dashboard built with Spring Boot and React.

## Features

### 📊 Market Overview
- **Live Market Indices** — S&P 500, NASDAQ, Dow Jones, SENSEX, NIFTY 50 with real-time updates
- **Market Stats** — Total stocks tracked, 24h volume, advancers/decliners
- **Top Gainers & Losers** — See which stocks are moving the market

### 📈 Stock Browser & Detail
- **Searchable Stock List** — Filter by name or symbol with watchlist support
- **Candlestick Charts** — Professional-grade charts using TradingView's Lightweight Charts™
- **Time Range Selector** — Switch between 1W, 1M, and 3M views
- **Key Statistics** — Open, High, Low, Volume, Market Cap at a glance

### 💰 Simulated Trading
- **Buy/Sell Panel** — Quick trade UI with quantity controls and order summary
- **Portfolio Tracking** — Real-time P&L, allocation pie chart, and holdings table
- **Trade History** — Complete record of all executed trades
- **Cash Management** — Available balance auto-updates after each trade

### 📰 Market News
- **Curated News Feed** — 15 stock market articles with sentiment analysis
- **Filter by Sentiment** — Bullish, Bearish, or Neutral filtering
- **Symbol Tagging** — Filter news by related stock symbol

### ⚡ Live Simulation
- **Price Tick Engine** — Realistic random-walk price movements every 10 seconds
- **Market Updates** — Indices and stock prices update in real-time
- **Start/Stop Control** — Toggle live simulation from the sidebar

### 🎨 UI/UX
- **Dark Theme** — Professional trading dashboard aesthetic with glass morphism
- **Responsive Design** — Desktop, tablet, and mobile layouts
- **Watchlist** — Star your favorite stocks for quick access
- **Animations** — Smooth transitions and micro-interactions throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3.4, Spring Data JPA, H2/PostgreSQL |
| **Frontend** | React 18, TypeScript, Vite |
| **Charts** | Lightweight Charts™ (TradingView), Recharts |
| **Icons** | Lucide React |
| **Validation** | Bean Validation, TypeScript strict mode |
| **Database** | H2 (dev), PostgreSQL (production via Docker) |

## Quick Start

Prerequisites: **JDK 21+**, Maven 3.9+, Node 20+

```bash
# Terminal 1 — Start the API
cd backend
mvn spring-boot:run

# Terminal 2 — Start the UI
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

Click **"Start Live"** in the sidebar to begin price simulation.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/overview` | Market indices, stats, gainers/losers |
| GET | `/api/stocks` | List all stocks |
| GET | `/api/stocks/search?q=` | Search stocks by name/symbol |
| GET | `/api/stocks/{id}` | Stock detail with price history |
| GET | `/api/stocks/{id}/prices?range=` | Filtered price history (1W, 1M, 3M, 1Y) |
| GET | `/api/portfolio` | Portfolio holdings, P&L, trade history |
| POST | `/api/trade` | Execute buy/sell trade |
| GET | `/api/news` | Market news feed |
| GET | `/api/news?symbol=` | Filter news by stock symbol |
| POST | `/api/simulate/tick` | Trigger price simulation tick |

## Docker (PostgreSQL)

```bash
docker compose up
```

Uses PostgreSQL 16 with automatic schema updates and preloaded sample data.
