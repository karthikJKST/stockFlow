# StockFlow 📈

> **Real-time stock market intelligence platform** — Live quotes, portfolio tracking, technical analysis, and paper trading.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000?logo=vercel)](https://stock-flow-ashen.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://stockflow-rr2k.onrender.com)
[![API Health](https://img.shields.io/badge/Health-UP-22c55e)](https://stockflow-rr2k.onrender.com/api/health)
[![CI](https://github.com/karthikJKST/stockFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/karthikJKST/stockFlow/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)

---

## 🚀 Live Demo

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | [https://stock-flow-ashen.vercel.app](https://stock-flow-ashen.vercel.app) | `demo` / `demo123` |
| **Backend API** | [https://stockflow-rr2k.onrender.com](https://stockflow-rr2k.onrender.com) | — |
| **Health Endpoint** | [https://stockflow-rr2k.onrender.com/api/health](https://stockflow-rr2k.onrender.com/api/health) | Public |

> **Demo credentials**: Login with username `demo` and password `demo123`. Also available: `alice`/`alice123`, `bob`/`bob123`.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📊 Market Overview** | Real-time indices (S&P 500, NASDAQ, Dow Jones), top gainers/losers |
| **💹 Live Stock Data** | Real-time prices via Finnhub API with graceful simulated fallback |
| **📈 Technical Analysis** | SMA, EMA, RSI, MACD, Bollinger Bands — interactive charts |
| **📋 Stock Screener** | Filter by price, change %, sector — sortable table |
| **🔄 Stock Comparison** | Side-by-side normalized performance comparison (up to 3 stocks) |
| **💼 Portfolio Tracking** | Paper trading with P&L tracking, allocation pie chart |
| **📰 News Sentiment** | Aggregated market news with sentiment scoring per stock |
| **🔔 Price Alerts** | Set above/below price targets with browser notifications |
| **📱 Responsive** | Fully adaptive — dark/light theme, desktop & mobile |
| **🌐 Multi-Currency** | Toggle between USD ($) and INR (₹) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vercel (CDN)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │          React + Vite + TypeScript            │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Market  │ │  Stock   │ │  Portfolio    │  │  │
│  │  │Overview │ │  Detail  │ │  View         │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Compare │ │  News    │ │  Trading     │  │  │
│  │  │  View   │ │  Feed    │ │  Panel       │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  │            WebSocket (STOMP/SockJS)            │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │ REST + WebSocket
┌───────────────────────┼─────────────────────────────┐
│              Render (Docker Web Service)              │
│  ┌───────────────────────────────────────────────┐  │
│  │         Spring Boot 3 + Java 21               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │  API    │ │  Auth    │ │  WebSocket    │  │  │
│  │  │Controller│ │Controller│ │  Publisher   │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │Finnhub  │ │  Stock   │ │  Technical   │  │  │
│  │  │Service  │ │Simulator │ │  Indicators  │  │  │
│  │  └─────────┘ └──────────┘ └───────────────┘  │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │ JDBC
             ┌──────────┴──────────┐
             │   Neon PostgreSQL    │
             │   (Serverless)       │
             └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript 5** | Type safety |
| **Vite** | Build tool & dev server |
| **Lightweight Charts** | Candlestick & indicator charts |
| **Recharts** | Portfolio performance & allocation charts |
| **STOMP.js + SockJS** | WebSocket real-time streaming |
| **Lucide React** | Icon library |
| **Vercel** | Hosting & CDN |

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 21** | Runtime |
| **Spring Boot 3** | Framework |
| **Spring Security** | JWT authentication & authorization |
| **Spring WebSocket** | Real-time price streaming (STOMP) |
| **Spring Data JPA** | Database access |
| **PostgreSQL** | Primary database (via Neon) |
| **H2** | Local development database |
| **Flyway** | Database migrations |
| **Finnhub API** | Real-time market data |
| **Docker** | Containerized deployment |
| **Render** | Cloud hosting |

---

## 📦 Installation

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL (or Docker for local)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/karthikJKST/stockFlow.git
cd stockFlow

# 2. Start backend
cd backend
./mvnw spring-boot:run -Dspring.profiles.active=postgres

# 3. Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:8080`.

### Using Docker Compose

```bash
docker compose up
```

This starts PostgreSQL, the backend API, and all required services.

---

## 🔐 Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | ✅ (prod) | `jdbc:h2:mem:stockflow` | PostgreSQL JDBC URL |
| `DB_USERNAME` | ✅ (prod) | `sa` | Database username |
| `DB_PASSWORD` | ✅ (prod) | — | Database password |
| `JWT_SECRET` | ✅ (prod) | Dev-only default | Secret key for JWT tokens |
| `CORS_ORIGINS` | ✅ (prod) | `http://localhost:5173` | Allowed frontend origins (comma-separated) |
| `FINNHUB_API_KEY` | ❌ | — | Finnhub API key for live data |
| `PORT` | ❌ | `8080` | Server port (Render sets this) |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ (prod) | `http://localhost:8080/api` | Backend API URL |
| `VITE_WS_URL` | ❌ | `http://localhost:8080/ws` | WebSocket endpoint URL |

---

## 📁 Project Structure

```
stockflow/
├── backend/
│   ├── Dockerfile              # Multi-stage Docker build
│   ├── pom.xml                 # Maven configuration
│   └── src/main/
│       ├── java/com/stockflow/api/
│       │   ├── ApiController.java       # REST endpoints
│       │   ├── AuthController.java      # Authentication
│       │   ├── DataInitializer.java     # Seed data
│       │   ├── FinnhubService.java      # Market data API
│       │   ├── IndicatorsService.java   # Technical analysis
│       │   ├── JwtUtil.java             # JWT utilities
│       │   ├── JwtAuthFilter.java       # JWT filter
│       │   ├── PricePublisher.java      # WebSocket publisher
│       │   ├── PriceSimulator.java      # Fallback simulation
│       │   ├── SecurityConfig.java      # Security + CORS
│       │   ├── StockFlowApplication.java
│       │   ├── StockModels.java         # JPA entities
│       │   ├── Repositories.java        # Data repositories
│       │   └── WebSocketConfig.java     # WebSocket config
│       └── resources/
│           ├── application.yml          # Dev config
│           ├── application-prod.yml     # Production config
│           └── application-postgres.yml  # Docker config
├── frontend/
│   ├── vercel.json              # SPA routing
│   ├── vite.config.ts           # Vite configuration
│   └── src/
│       ├── App.tsx              # Main app with routing
│       ├── components/
│       │   ├── MarketOverview.tsx    # Indices & market stats
│       │   ├── StockListView.tsx     # Stock table & search
│       │   ├── StockDetailView.tsx   # Detail + chart + trade
│       │   ├── PortfolioView.tsx     # Holdings & performance
│       │   ├── CompareView.tsx       # Stock comparison
│       │   ├── NewsFeed.tsx          # News with sentiment
│       │   ├── TradingPanel.tsx      # Buy/Sell interface
│       │   ├── AuthModal.tsx         # Login/Register
│       │   └── CandlestickChart.tsx  # TradingView-style chart
│       ├── context/
│       │   └── AuthContext.tsx       # Auth state
│       └── styles.css                # Complete styles
├── docker-compose.yml           # Local PostgreSQL setup
└── README.md                   # This file
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Sign in |
| `GET` | `/api/auth/me` | Yes | Current user |
| `GET` | `/api/market/overview` | Yes | Indices & market stats |
| `GET` | `/api/stocks` | Yes | All stocks |
| `GET` | `/api/stocks/search?q=` | Yes | Search stocks |
| `GET` | `/api/stocks/{id}` | Yes | Stock detail + history |
| `GET` | `/api/stocks/{id}/indicators` | Yes | Technical indicators |
| `GET` | `/api/stocks/{id}/orderbook` | Yes | Order book simulation |
| `GET` | `/api/stocks/{id}/prices` | Yes | Price history by range |
| `GET` | `/api/stocks/compare?ids=` | Yes | Compare stocks |
| `GET` | `/api/portfolio` | Yes | User portfolio |
| `POST` | `/api/trade` | Yes | Execute trade |
| `GET` | `/api/news` | Yes | Market news |
| `POST` | `/api/ws/start` | Yes | Start WebSocket stream |
| `POST` | `/api/ws/stop` | Yes | Stop WebSocket stream |
| `GET` | `/api/ws/status` | Yes | WebSocket status |

### WebSocket
- **Endpoint**: `/ws` (STOMP over SockJS)
- **Subscribe**: `/topic/prices`
- **Payload**: Real-time stock prices, indices, gainers/losers, volume

---

## 🧪 Testing Locally

```bash
# Backend tests
cd backend
./mvnw test

# Frontend build & typecheck
cd frontend
npm run build
```

---

## 📸 Screenshots

> *Screenshots coming soon. See the [`assets/`](assets/) directory for placeholder images.*

| View | Description |
|------|-------------|
| **Market Overview** | Indices strip, market stats, top gainers/losers, news sentiment |
| **Stock Detail** | Candlestick chart, technical indicators, order book, trading panel |
| **Portfolio** | Holdings table, performance chart, allocation pie chart |
| **Compare** | Normalized performance overlay, side-by-side metrics table |
| **News Feed** | Filterable news grid with sentiment badges |

---

## 🔮 Future Improvements

- [ ] Real-time intraday streaming (WebSocket push for live ticks)
- [ ] Multi-user watchlist with cloud sync
- [ ] Dark/light theme persistence across devices
- [ ] Portfolio export (PDF reports)
- [ ] Advanced chart drawing tools (trendlines, annotations)
- [ ] Real-time notifications via push API
- [ ] OAuth2 social login (Google, GitHub)
- [ ] Rate limiting and brute-force protection
- [ ] Email verification for registration
- [ ] Mobile native app (React Native)

---

## ⚠️ Known Limitations

- **Finnhub Free Tier**: Limited to 60 API calls/minute. Stock updates are rotated across 3 stocks per tick to stay within limit. Falls back to simulated data if exceeded.
- **Intraday Candles**: Simulated around real prices (free Finnhub doesn't provide real-time intraday candlestick streaming).
- **Paper Trading Only**: Trades are simulated — no real financial transactions occur.
- **Single Database**: All users share the same Neon PostgreSQL instance (adequate for demo scale).

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🏆 Acknowledgments

- [Finnhub](https://finnhub.io/) for free stock market API
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) by TradingView
- [Lucide](https://lucide.dev/) for beautiful icons
- [Recharts](https://recharts.org/) for composable charts
- [Render](https://render.com/) and [Vercel](https://vercel.com/) for hosting
- [Neon](https://neon.tech/) for serverless PostgreSQL

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/karthikJKST">Karthik JKST</a>
</p>
