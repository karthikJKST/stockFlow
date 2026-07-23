<div align="center">

# 📈 StockFlow — Market Intelligence Dashboard

**Real-time stock market tracking and simulated trading platform**

[![CI](https://github.com/karthikJKST/stockFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/karthikJKST/stockFlow/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-21-%23ED8B00?logo=openjdk)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-%236DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-%2361DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-%233178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-%23646CFF?logo=vite)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success" alt="Active">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome">
</p>

---

**Live Demo** (Coming soon — deploy using the guide below) · [Report Bug](https://github.com/karthikJKST/stockFlow/issues) · [Request Feature](https://github.com/karthikJKST/stockFlow/issues)

</div>

---

## ✨ Features

### 📊 Market Overview
| Feature | Description |
|---------|-------------|
| **Live Indices** | S&P 500, NASDAQ, Dow Jones, SENSEX, NIFTY 50 with real-time updates |
| **Market Stats** | Total stocks, 24h volume, advancers vs decliners |
| **Top Movers** | Biggest gainers and losers with price and percentage changes |
| **Heatmap** | Visual sector performance overview |

### 📈 Stock Browser & Detail
| Feature | Description |
|---------|-------------|
| **Search & Filter** | Search by name/symbol, filter by price range or change % |
| **Screener** | Advanced filtering with sort by price, change, or symbol |
| **Candlestick Charts** | Professional charts via TradingView Lightweight Charts™ |
| **Technical Indicators** | Moving Averages (SMA 20/50), Bollinger Bands, RSI, MACD |
| **Time Ranges** | 1 week, 1 month, 3 months, 1 year |
| **Order Book** | Simulated bid/ask depth view |
| **Price Alerts** | Set notifications for price crossing thresholds |
| **Currency Toggle** | Switch between USD ($) and INR (₹) |

### 💰 Simulated Trading
| Feature | Description |
|---------|-------------|
| **Buy/Sell Panel** | Quick trade UI with quantity controls and order summary |
| **Portfolio Tracking** | Real-time P&L, allocation pie chart, holdings table |
| **Trade History** | Complete record of all executed trades |
| **Cash Management** | $100,000 starting balance, auto-updates after trades |

### 📰 Market News
| Feature | Description |
|---------|-------------|
| **Curated Feed** | 15 stock market articles with sentiment analysis |
| **Filtering** | By sentiment (Bullish/Bearish/Neutral) or stock symbol |

### ⚡ Live Simulation
| Feature | Description |
|---------|-------------|
| **Price Engine** | Realistic random-walk price movements every 10 seconds |
| **Flash Effects** | Visual price change indicators (green up, red down) |
| **Start/Stop** | Toggle live simulation from sidebar |
| **WebSocket** | Real-time updates via STOMP/SockJS |

### 🎨 User Experience
| Feature | Description |
|---------|-------------|
| **Dark Theme** | Professional trading aesthetic with glass morphism |
| **Light Mode** | Toggle to light theme for daytime use |
| **Responsive** | Desktop, tablet, and mobile layouts |
| **Watchlist** | Star favorites for quick access |
| **Animations** | Count-up numbers, staggered list animations, price flashes |
| **Sounds** | Optional alert sounds for price triggers |

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend Runtime** | Java (OpenJDK) | 21 |
| **Backend Framework** | Spring Boot | 3.4 |
| **ORM** | Spring Data JPA | — |
| **Auth** | JWT (jjwt) + Spring Security | 0.12.6 |
| **Database** | H2 (dev) / PostgreSQL 16 (prod) | — |
| **API Docs** | SpringDoc OpenAPI | 2.8.5 |
| **WebSocket** | STOMP over SockJS | — |
| | | |
| **Frontend** | React | 18 |
| **Language** | TypeScript | 5.4 |
| **Bundler** | Vite | 5.4 |
| **Charts** | Lightweight Charts™ (TradingView) | 4.1 |
| **Charts (alt)** | Recharts | 2.12 |
| **Icons** | Lucide React | 0.344 |
| **Styling** | CSS Custom Properties (Glass morphism) | — |
| **Real-time** | @stomp/stompjs + sockjs-client | — |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| **JDK** | 21+ | `java -version` |
| **Maven** | 3.9+ | `mvn -version` |
| **Node.js** | 20+ | `node -v` |
| **npm** | 10+ | `npm -v` |

### 1. Clone & Install

```bash
git clone https://github.com/karthikJKST/stockFlow.git
cd stockFlow
```

### 2. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The API starts at **http://localhost:8080**. The H2 console is available at `/h2-console`.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI opens at **http://localhost:5173**.

### 4. Log In

Use one of the preloaded demo accounts:

| Username | Password | Display Name |
|----------|----------|-------------|
| `demo` | `demo123` | Alex Kumar |
| `alice` | `alice123` | Alice Chen |
| `bob` | `bob123` | Bob Smith |

### 5. Activate Live Simulation

Click **"Start Live"** in the sidebar to begin real-time price updates.

---

## 🐳 Docker Deployment (PostgreSQL)

```bash
docker compose up
```

This starts:
- **PostgreSQL 16** on port `5432`
- **StockFlow API** on port `8080`

The backend auto-configures with PostgreSQL and seeds sample data on first run.

---

## 🚀 Deployment Guide

StockFlow is designed to be deployed with **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).

### Step 1: Database — Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project (choose any region)
3. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/stockflow?sslmode=require
   ```

### Step 2: Backend — Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (`karthikJKST/stockFlow`)
4. Configure:
   - **Name**: `stockflow-api`
   - **Runtime**: `Java` (Render auto-detects Maven)
   - **Build Command**: `cd backend && mvn clean package -DskipTests -B`
   - **Start Command**: `java -jar backend/target/stockflow-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
   - **Plan**: Free
5. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | Your Neon connection string |
| `DB_USERNAME` | Neon database username |
| `DB_PASSWORD` | Neon database password |
| `JWT_SECRET` | A strong random string (min 32 chars) |
| `CORS_ORIGINS` | Your Vercel frontend URL (e.g. `https://stockflow.vercel.app`) |
| `FINNHUB_API_KEY` | *(optional)* Your Finnhub API key |

6. Click **Deploy**
7. Once deployed, note your backend URL: `https://stockflow-api.onrender.com`

### Step 3: Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo (`karthikJKST/stockFlow`)
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL + `/api` (e.g. `https://stockflow-api.onrender.com/api`) |
| `VITE_WS_URL` | Your Render backend URL + `/ws` (e.g. `https://stockflow-api.onrender.com/ws`) |

6. Click **Deploy**
7. Once deployed, note your frontend URL: `https://stockflow.vercel.app`

### Step 4: Update CORS

After the frontend is deployed, go back to **Render Dashboard** → **stockflow-api** → **Environment** and update `CORS_ORIGINS` to include your Vercel URL:
```
https://stockflow.vercel.app,http://localhost:5173
```
Then click **Manual Deploy** → **Deploy latest commit** to restart the backend with the new CORS settings.

### Step 5: Verify

- **Health**: `https://stockflow-api.onrender.com/api/health` should return `{"status":"UP"}`
- **Frontend**: Visit your Vercel URL, register a new account, and start trading!

---

## 🔧 Environment Variables

### Backend

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DB_URL` | ✅ | PostgreSQL JDBC URL | — |
| `DB_USERNAME` | ✅ | Database username | — |
| `DB_PASSWORD` | ✅ | Database password | — |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) | Dev-only default |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins | `http://localhost:5173` |
| `SPRING_PROFILES_ACTIVE` | ✅ | Spring profile | `postgres` (dev) / `prod` (render) |
| `PORT` | ❌ | Server port (Render sets this) | `8080` |
| `FINNHUB_API_KEY` | ❌ | Finnhub API key for live data | Simulated data |

### Frontend

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | Backend API base URL | `http://localhost:8080/api` |
| `VITE_WS_URL` | ✅ | WebSocket endpoint URL | `http://localhost:8080/ws` |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Sign in (returns JWT) |
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/me` | Current user info |
| PUT | `/api/auth/theme` | Update theme preference |

### Market Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/overview` | Indices, stats, gainers/losers |
| GET | `/api/stocks` | List all stocks |
| GET | `/api/stocks/search?q=` | Search by name/symbol |
| GET | `/api/stocks/{id}` | Stock detail with history |
| GET | `/api/stocks/{id}/prices?range=` | Filtered price history |
| GET | `/api/stocks/{id}/indicators` | Technical indicators |

### Trading

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | Holdings, P&L, trade history |
| POST | `/api/trade` | Execute buy/sell |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | Market news feed |
| GET | `/api/news?symbol=` | Filter by symbol |
| POST | `/api/simulate/tick` | Trigger price tick |

---

## 👷 CI/CD

Every push and pull request to `main` triggers automated builds via **GitHub Actions**:

| Job | What it does |
|-----|-------------|
| **Backend** | `mvn compile` → `mvn test` → `mvn package` on JDK 21 |
| **Frontend** | `npm ci` → `tsc --noEmit` → `vite build` on Node.js 22 |
| **Docker** | Builds backend Docker image with GHA caching |
| **Summary** | Reports pass/fail badges for all jobs |

![CI Pipeline](https://github.com/karthikJKST/stockFlow/actions/workflows/ci.yml/badge.svg)

---

## 📁 Project Structure

```
StockFlow/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── backend/
│   ├── src/main/java/com/stockflow/api/
│   │   ├── ApiController.java         # Market data & trade endpoints
│   │   ├── AuthController.java        # Login/register
│   │   ├── StockModels.java           # Domain models
│   │   ├── Repositories.java          # JPA repositories
│   │   ├── JwtUtil.java               # JWT token handling
│   │   ├── JwtAuthFilter.java         # Auth filter
│   │   ├── SecurityConfig.java        # Security config
│   │   ├── FinnhubService.java        # External API integration
│   │   ├── PriceSimulator.java        # Random-walk price engine
│   │   ├── PricePublisher.java        # WebSocket publisher
│   │   ├── WebSocketConfig.java       # WebSocket config
│   │   ├── DataInitializer.java       # Sample data seeder
│   │   ├── IndicatorsService.java     # Technical indicators
│   │   └── User.java / UserRepository.java
│   ├── src/main/resources/
│   │   ├── application.yml            # H2 dev config
│   │   └── application-postgres.yml   # PostgreSQL prod config
│   ├── Dockerfile
│   ├── pom.xml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root app with routing
│   │   ├── components/
│   │   │   ├── MarketOverview.tsx      # Dashboard
│   │   │   ├── StockListView.tsx       # Stock table
│   │   │   ├── StockDetailView.tsx     # Stock detail + chart
│   │   │   ├── CandlestickChart.tsx    # TradingView chart
│   │   │   ├── TradingPanel.tsx        # Buy/sell interface
│   │   │   ├── PortfolioView.tsx       # Portfolio + P&L
│   │   │   ├── CompareView.tsx         # Stock comparison
│   │   │   ├── NewsFeed.tsx            # News feed
│   │   │   ├── AuthModal.tsx           # Login/register modal
│   │   │   ├── NotificationPanel.tsx   # Notifications
│   │   │   ├── OrderBook.tsx           # Order book depth
│   │   │   └── ... (StockScreener, FeedbackCard, etc.)
│   │   ├── context/AuthContext.tsx      # Auth state management
│   │   ├── utils/useCountUp.ts         # Count-up animation hook
│   │   └── styles.css                  # All application styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
├── docker-compose.yml
├── .editorconfig
├── .gitattributes
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick steps:**
1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/karthikJKST">Karthik JKST</a>
</div>
