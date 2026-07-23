import { useEffect, useState, useCallback, useRef } from 'react'
import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  TrendingUp, TrendingDown, Search, Bell, Menu, X, Activity,
  BarChart3, Briefcase, Newspaper, Star, DollarSign, LineChart,
  ArrowUpRight, ArrowDownRight, ArrowUpDown, RefreshCw, Zap, LogIn, UserCircle,
  Sun, Moon, Volume2, VolumeX, IndianRupee
} from 'lucide-react'
import MarketOverview from './components/MarketOverview'
import StockListView from './components/StockListView'
import StockDetailView from './components/StockDetailView'
import PortfolioView from './components/PortfolioView'
import NewsFeed from './components/NewsFeed'
import CompareView from './components/CompareView'
import NotificationPanel from './components/NotificationPanel'
import AuthModal from './components/AuthModal'
import { useAuth } from './context/AuthContext'
import { playAlertSound, playAlertDownSound } from './utils/sounds'
import { useFormattedCountUp } from './utils/useCountUp'
import {
  SkeletonMarketOverview,
  SkeletonStockList,
  SkeletonPortfolio,
  SkeletonStockDetail
} from './components/SkeletonLoaders'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
const INR_RATE = 83.5 // 1 USD ≈ ₹83.5

export type Stock = {
  id: number; symbol: string; name: string; currentPrice: number
  changePercent: number; marketCap: number
}

export type Candle = {
  timestamp: number; open: number; high: number; low: number; close: number; volume: number
}

export type StockDetail = Stock & {
  sector: string; volume: number; priceHistory: Candle[]
}

export type MarketData = {
  indices: Array<{name:string; symbol:string; value:number; change:number; changePercent:number}>
  totalStocks: number; totalVolume: number; advancers: number; decliners: number
  topGainers: Stock[]; topLosers: Stock[]
}

export type PortfolioData = {
  cashBalance: number; totalValue: number; totalPL: number; totalReturnPercent: number
  holdings: Array<{
    stockId:number; symbol:string; name:string; shares:number
    avgPrice:number; currentPrice:number; marketValue:number; pl:number; plPercent:number; allocation:number
  }>
  recentTrades: Array<{id:number; symbol:string; type:'BUY'|'SELL'; shares:number; price:number; timestamp:number}>
}

export type NewsItem = {
  id:number; headline:string; source:string; sentiment:string
  summary:string; symbol:string; timestamp:number
}

const navItems = [
  { id: 'overview', label: 'Market Overview', icon: Activity },
  { id: 'stocks', label: 'All Stocks', icon: BarChart3 },
  { id: 'compare', label: 'Compare', icon: ArrowUpDown },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
] as const

type View = typeof navItems[number]['id']

/** Small P&L indicator in the header with count-up animation */
function MiniPL({ totalPL, totalReturnPercent }: { totalPL: number; totalReturnPercent: number }) {
  const isPositive = totalPL >= 0
  const animatedReturn = useFormattedCountUp(totalReturnPercent, (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, 600)
  return (
    <div className={`mini-pl ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      <span>{animatedReturn}</span>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, authFetch, logout, saveTheme } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [watchlist, setWatchlist] = useState<number[]>(() => {
    const saved = localStorage.getItem('stockflow_watchlist')
    return saved ? JSON.parse(saved) : [1, 3, 5]
  })
  const [simulating, setSimulating] = useState(false)
  const [dataSource, setDataSource] = useState<'live' | 'simulated' | 'simulated_fallback' | 'rate_limited'>('simulated')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Prefer server theme from user object, fallback to localStorage, default dark
    const saved = localStorage.getItem('stockflow_theme')
    return (saved === 'dark' || saved === 'light') ? saved : 'dark'
  })
  const stompClientRef = useRef<Client | null>(null)
  const prevPricesRef = useRef<Map<number, number>>(new Map())
  const flashTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const [priceFlash, setPriceFlash] = useState<Map<number, 'up' | 'down'>>(new Map())
  const [showNotifications, setShowNotifications] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'INR'>(() => {
    const saved = localStorage.getItem('stockflow_currency')
    return (saved === 'USD' || saved === 'INR') ? saved : 'USD'
  })
  const [soundEnabled, setSoundEnabled] = useState<'on' | 'off'>(() => {
    const saved = localStorage.getItem('stockflow_sound')
    return (saved === 'on' || saved === 'off') ? saved : 'on'
  })
  const [alerts, setAlerts] = useState<Array<{stockId:number; symbol:string; price:number; direction?: 'above'|'below'; createdAt:number}>>(() => {
    const saved = localStorage.getItem('stockflow_alerts')
    return saved ? JSON.parse(saved) : []
  })

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('stockflow_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      // Save to backend in background
      saveTheme(next)
      return next
    })
  }, [saveTheme])

  // Show auth modal if not authenticated; auto-close on login
  useEffect(() => {
    if (!authLoading && !user) setShowAuth(true)
  }, [authLoading, user])

  // Auto-close auth modal when user successfully logs in
  useEffect(() => {
    if (user && showAuth) setShowAuth(false)
  }, [user])

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const [marketRes, stocksRes, portfolioRes, newsRes] = await Promise.all([
        authFetch(`${API}/market/overview`),
        authFetch(`${API}/stocks`),
        authFetch(`${API}/portfolio`),
        authFetch(`${API}/news`)
      ])
      if (!marketRes.ok) throw new Error('Cannot connect to StockFlow API')
      setMarketData(await marketRes.json())
      setStocks(await stocksRes.json())
      setPortfolio(await portfolioRes.json())
      setNews(await newsRes.json())
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }, [user, authFetch])

  useEffect(() => { fetchData() }, [fetchData])

  // ── WebSocket Live Streaming ──
  const startSimulation = useCallback(async () => {
    if (stompClientRef.current?.connected) return
    setSimulating(true)

    await authFetch(`${API}/ws/start`, { method: 'POST' })

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe('/topic/prices', (message: IMessage) => {
          try {
            const snapshot = JSON.parse(message.body)
            if (snapshot.dataSource) setDataSource(snapshot.dataSource)
            if (snapshot.stocks) {
              const newFlash = new Map<number, 'up' | 'down'>()
              const prev = prevPricesRef.current
              for (const s of snapshot.stocks as Stock[]) {
                const oldPrice = prev.get(s.id)
                if (oldPrice !== undefined && oldPrice !== s.currentPrice) {
                  newFlash.set(s.id, s.currentPrice > oldPrice ? 'up' : 'down')
                }
                prev.set(s.id, s.currentPrice)
              }
              if (newFlash.size > 0) {
                // Clear previous flash timeouts for updated stocks
                for (const id of newFlash.keys()) {
                  const existing = flashTimeoutsRef.current.get(id)
                  if (existing) clearTimeout(existing)
                  flashTimeoutsRef.current.set(id, setTimeout(() => {
                    setPriceFlash(prev2 => {
                      const next = new Map(prev2)
                      next.delete(id)
                      return next
                    })
                    flashTimeoutsRef.current.delete(id)
                  }, 800))
                }
                // Merge new flashes with existing ones (don't replace, or mid-animation flashes get cancelled)
                setPriceFlash(prev => {
                  const merged = new Map(prev)
                  for (const [id, dir] of newFlash) merged.set(id, dir)
                  return merged
                })
              }
              // ── Check price alerts ──
              const currentAlerts = JSON.parse(localStorage.getItem('stockflow_alerts') || '[]')
              const triggered: Array<{symbol: string; price: number; direction: 'above'|'below'}> = []
              const remaining: Array<any> = []
              for (const a of currentAlerts) {
                const updated = (snapshot.stocks as Stock[]).find(s => s.id === a.stockId)
                if (!updated) { remaining.push(a); continue }
                const direction = a.direction || 'above'
                const hit = direction === 'above'
                  ? updated.currentPrice >= a.price
                  : updated.currentPrice <= a.price
                if (hit) {
                  triggered.push({ symbol: a.symbol, price: a.price, direction })
                } else {
                  remaining.push(a)
                }
              }
              if (triggered.length > 0) {
                localStorage.setItem('stockflow_alerts', JSON.stringify(remaining))
                setAlerts(remaining)
                for (const t of triggered) {
                  if (soundEnabled === 'on') {
                    if (t.direction === 'below') playAlertDownSound()
                    else playAlertSound()
                  }
                  // Browser notification
                  if ('Notification' in window && Notification.permission === 'granted') {
                    const sym = currency === 'INR' ? '₹' : '$'
                    new Notification(`⚠️ ${t.symbol} Alert`, {
                      body: `${t.symbol} ${t.direction === 'above' ? 'rose above' : 'dropped below'} ${sym}${t.price.toLocaleString()}`,
                      icon: '/vite.svg',
                    })
                  }
                }
              }
              setStocks(snapshot.stocks)
            }
            if (snapshot.indices) {
              setMarketData(prev => prev ? {
                ...prev,
                indices: snapshot.indices,
                totalVolume: snapshot.totalVolume,
                advancers: snapshot.advancers,
                decliners: snapshot.decliners,
                topGainers: snapshot.topGainers,
                topLosers: snapshot.topLosers,
              } : prev)
            }
            authFetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio).catch(() => {})
          } catch {}
        })
      },
      onDisconnect: () => setSimulating(false),
      onStompError: () => setSimulating(false),
    })

    client.activate()
    stompClientRef.current = client
  }, [authFetch, currency])

  const stopSimulation = useCallback(async () => {
    await authFetch(`${API}/ws/stop`, { method: 'POST' }).catch(() => {})
    if (stompClientRef.current) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
    }
    setSimulating(false)
  }, [authFetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate()
      }
      // Clear any pending flash timeouts
      for (const t of flashTimeoutsRef.current.values()) clearTimeout(t)
      flashTimeoutsRef.current.clear()
    }
  }, [])

  // Escape key closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const toggleWatchlist = (stockId: number) => {
    setWatchlist(prev => {
      const next = prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId]
      localStorage.setItem('stockflow_watchlist', JSON.stringify(next))
      return next
    })
  }

  const filteredStocks = stocks.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const watchlistStocks = stocks.filter(s => watchlist.includes(s.id))

  const handleStockSelect = (id: number) => {
    setSelectedStockId(id)
    setView('stocks')
  }

  const formatMoney = (value: number) => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value * INR_RATE)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value)
  }

  const formatLargeNumber = (value: number) => {
    const num = currency === 'INR' ? value * INR_RATE : value
    const prefix = currency === 'INR' ? '₹' : '$'
    if (num >= 1e12) return prefix + (num / 1e12).toFixed(2) + 'T'
    if (num >= 1e9) return prefix + (num / 1e9).toFixed(2) + 'B'
    if (num >= 1e6) return prefix + (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return prefix + (num / 1e3).toFixed(1) + 'K'
    return prefix + num.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')
  }

  const renderView = () => {
    if (error) return (
      <div className="error-state">
        <div className="error-icon">
          <Zap size={48} />
        </div>
        <h3>Unable to connect</h3>
        <p>Please ensure the StockFlow API server is running on port 8080</p>
        <p className="error-detail">{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )

    if (!marketData) return <SkeletonMarketOverview />

    switch (view) {
      case 'overview':
        return <MarketOverview
          marketData={marketData}
          news={news}
          onStockSelect={handleStockSelect}
          formatMoney={formatMoney}
          formatLarge={formatLargeNumber}
          priceFlash={priceFlash}
        />
      case 'stocks':
        return selectedStockId ? (
          <StockDetailView
            stockId={selectedStockId}
            onBack={() => setSelectedStockId(null)}
            portfolio={portfolio}
            onTradeComplete={() => {
              authFetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio)
            }}
            formatMoney={formatMoney}
            formatLarge={formatLargeNumber}
            API={API}
            authFetch={authFetch}
          />
        ) : (
          <StockListView
            stocks={filteredStocks}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onStockSelect={handleStockSelect}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            formatMoney={formatMoney}
            formatLarge={formatLargeNumber}
            priceFlash={priceFlash}
          />
        )
      case 'portfolio':
        return <PortfolioView
          portfolio={portfolio}
          onStockSelect={handleStockSelect}
          formatMoney={formatMoney}
          formatLarge={formatLargeNumber}
        />
      case 'compare':
        return <CompareView
          stocks={filteredStocks}
          authFetch={authFetch}
          API={API}
          formatMoney={formatMoney}
          formatLarge={formatLargeNumber}
          onStockSelect={handleStockSelect}
        />
      case 'news':
        return <NewsFeed
          news={news}
          stocks={stocks}
          formatLarge={formatLargeNumber}
        />
      case 'watchlist':
        return (
          <StockListView
            stocks={watchlistStocks}
            searchQuery=""
            onSearchChange={() => {}}
            onStockSelect={handleStockSelect}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            formatMoney={formatMoney}
            formatLarge={formatLargeNumber}
            isWatchlist
            priceFlash={priceFlash}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <LineChart size={26} strokeWidth={2.5} />
          <div>
            <span className="brand-name">StockFlow</span>
            <span className="brand-sub">Market Intelligence</span>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setSidebarOpen(false); setSelectedStockId(null) }}
              aria-label={`Navigate to ${item.label}`}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <item.icon size={19} aria-hidden="true" />
              <span>{item.label}</span>
              {item.id === 'stocks' && <span className="nav-badge">{stocks.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="live-indicator">
            <span className={`live-dot ${simulating ? 'active' : ''} data-source-${dataSource}`} />
            <span className="live-label">{simulating ? (dataSource === 'live' ? 'Live' : dataSource === 'rate_limited' ? 'Rate Limited' : 'Simulated') : 'Paused'}</span>
          </div>
          <button
            className={`sim-btn ${simulating ? 'stop' : 'start'}`}
            onClick={simulating ? stopSimulation : startSimulation}
            aria-label={simulating ? 'Stop live streaming' : 'Start live streaming'}
            aria-pressed={simulating}
          >
            <Zap size={14} aria-hidden="true" />
            {simulating ? 'Stop' : 'Start'} Live
          </button>
          <div className="profile-card" onClick={() => { if (user) { setView('portfolio'); setSidebarOpen(false) } else setShowAuth(true) }} style={{cursor:'pointer'}}>
            <div className="avatar">
              {user ? user.displayName.charAt(0).toUpperCase() : <UserCircle size={18} />}
            </div>
            <div className="profile-info">
              <strong>{user?.displayName || 'Not signed in'}</strong>
              <small>{user ? `@${user.username}` : 'Click to sign in'}</small>
            </div>
          </div>
          <button className="sim-btn theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button className="sim-btn" onClick={() => {
            const next = soundEnabled === 'on' ? 'off' : 'on'
            setSoundEnabled(next)
            localStorage.setItem('stockflow_sound', next)
          }} aria-label={`Sound ${soundEnabled === 'on' ? 'off' : 'on'}`} aria-pressed={soundEnabled === 'on'}>
            {soundEnabled === 'on' ? <Volume2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />}
            {soundEnabled === 'on' ? 'Sound On' : 'Sound Off'}
          </button>
          {user && (
            <button className="sim-btn" onClick={() => { logout(); setShowAuth(true) }} aria-label="Sign out of your account">
              <LogIn size={12} aria-hidden="true" /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => { if (user) setShowAuth(false) }} />}

      {/* Main Content */}
      <main>
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            {view === 'stocks' && selectedStockId ? (
              <button className="back-btn" onClick={() => setSelectedStockId(null)} aria-label="Go back to stock list">
                <ArrowUpRight size={16} style={{ transform: 'rotate(-45deg)' }} aria-hidden="true" />
                <span>Back to stocks</span>
              </button>
            ) : (
              <div className="header-title">
                <h1>{navItems.find(n => n.id === view)?.label || 'Dashboard'}</h1>
                {marketData && (
                  <div className="market-status">
                    <span className={`status-dot ${marketData.indices[0]?.changePercent >= 0 ? 'up' : 'down'}`} />
                    <span>Market {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="header-right">
            {view !== 'watchlist' && (
              <div className="search-box">
                <Search size={16} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search stocks by name or symbol"
                />
              </div>
            )}
            <button
              className={`currency-toggle ${currency === 'INR' ? 'inr' : 'usd'}`}
              onClick={() => {
                const next = currency === 'USD' ? 'INR' : 'USD'
                setCurrency(next)
                localStorage.setItem('stockflow_currency', next)
              }}
              title={`Switch to ${currency === 'USD' ? 'Indian Rupee (₹)' : 'US Dollar ($)'}`}
            >
              {currency === 'INR' ? (
                <><IndianRupee size={15} /> ₹</>
              ) : (
                <><DollarSign size={15} /> $</>
              )}
            </button>
            <button
              className={`icon-btn notification-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={19} />
              {alerts.length > 0 && <span className="notification-dot" />}
            </button>
            {showNotifications && (
              <NotificationPanel
                news={news}
                onClose={() => setShowNotifications(false)}
                formatMoney={formatMoney}
              />
            )}
            <div className="header-quick-stats">
              {portfolio && (
                <MiniPL
                  totalPL={portfolio.totalPL}
                  totalReturnPercent={portfolio.totalReturnPercent}
                />
              )}
            </div>
          </div>
        </header>

        <div className="content-area">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
