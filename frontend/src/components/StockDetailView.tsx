import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, Building2, Globe, Activity, LineChart, BookOpen, Bell, Loader2 } from 'lucide-react'
import CandlestickChart, { RSIPanel, MACDPanel } from './CandlestickChart'
import { TradingPanel } from './TradingPanel'
import OrderBook from './OrderBook'
import { useFormattedCountUp } from '../utils/useCountUp'
import type { StockDetail, Candle, PortfolioData } from '../App'

interface Props {
  stockId: number
  onBack: () => void
  portfolio: PortfolioData | null
  onTradeComplete: () => void
  formatMoney: (v: number) => string
  formatLarge: (v: number) => string
  API: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

interface IndicatorData {
  timestamps?: number[]
  sma20?: (number | null)[]
  sma50?: (number | null)[]
  rsi14?: (number | null)[]
  macd?: { macd?: (number | null)[]; signal?: (number | null)[]; histogram?: (number | null)[] }
  bollinger?: { upper?: (number | null)[]; middle?: (number | null)[]; lower?: (number | null)[] }
}

export default function StockDetailView({ stockId, onBack, portfolio, onTradeComplete, formatMoney, formatLarge, API, authFetch }: Props) {
  const [stock, setStock] = useState<StockDetail | null>(null)
  const [candleData, setCandleData] = useState<Candle[]>([])
  const [indicators, setIndicators] = useState<IndicatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'1W' | '1M' | '3M' | '1Y'>('1M')
  const [showTrade, setShowTrade] = useState(false)
  const [showOB, setShowOB] = useState(false)
  const [showMA, setShowMA] = useState(true)
  const [showBB, setShowBB] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above')
  const [alertMsg, setAlertMsg] = useState('')

  // Fetch stock detail + indicators on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch(`${API}/stocks/${stockId}`).then(r => r.ok ? r.json() : null),
      authFetch(`${API}/stocks/${stockId}/indicators`).then(r => r.ok ? r.json() : null),
    ]).then(([stockData, indData]) => {
      setStock(stockData)
      setIndicators(indData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [stockId, authFetch])

  // Fetch price candles by range from the backend (server-side filtering with fresh timestamps)
  const fetchPricesByRange = useCallback(async (stockId: number, range: string) => {
    try {
      const res = await authFetch(`${API}/stocks/${stockId}/prices?range=${range}`)
      if (res.ok) {
        const data = await res.json()
        setCandleData(data)
      }
    } catch {}
  }, [authFetch, API])

  useEffect(() => {
    fetchPricesByRange(stockId, range)
  }, [stockId, range, fetchPricesByRange])

  // ═══════════════════════════════════════════
  // Hooks MUST be called before any early returns
  // (React Rules of Hooks — unconditional order)
  // ═══════════════════════════════════════════
  const animatedPrice = useFormattedCountUp(stock?.currentPrice ?? 0, formatMoney, 800)

  if (loading) return (
    <div className="stock-detail-loading">
      <div className="loading-spinner-area">
        <Loader2 size={32} className="spinning" />
        <p>Loading stock data...</p>
      </div>
    </div>
  )
  if (!stock) return <div className="error-state"><p>Stock not found</p></div>

  const currentHolding = portfolio?.holdings.find(h => h.stockId === stockId)
  const isPositive = stock.changePercent >= 0

  const rsiValue = indicators?.rsi14
    ? indicators.rsi14.filter(v => v !== null).slice(-1)[0]
    : null

  const handleSetAlert = () => {
    if (!alertPrice) return
    const alerts = JSON.parse(localStorage.getItem('stockflow_alerts') || '[]')
    alerts.push({
      stockId,
      symbol: stock.symbol,
      price: Number(alertPrice),
      direction: alertDirection,
      createdAt: Date.now()
    })
    localStorage.setItem('stockflow_alerts', JSON.stringify(alerts))
    setAlertMsg(`Alert set — notifies when price goes ${alertDirection} ${formatMoney(Number(alertPrice))}`)
    setAlertPrice('')
    setTimeout(() => setAlertMsg(''), 4000)
  }

  return (
    <div className="stock-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="stock-ticker">
            <div className="ticker-icon">
              <span className="ticker-symbol-large">{stock.symbol}</span>
            </div>
            <div className="ticker-info">
              <h1>{stock.name}</h1>
              <div className="ticker-meta">
                <span className="meta-chip">{stock.sector}</span>
                {currentHolding && (
                  <span className="meta-chip holding-chip">
                    {currentHolding.shares} shares held
                  </span>
                )}
                {rsiValue !== null && (
                  <span className={`meta-chip ${rsiValue >= 70 ? 'overbought' : rsiValue <= 30 ? 'oversold' : ''}`}>
                    RSI {rsiValue?.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="ticker-price">
            <span className="current-price count-up-value">{animatedPrice}</span>
            <span className={`price-change ${isPositive ? 'up' : 'down'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="detail-header-right">
          <button className="btn btn-outline" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className={`btn ${showOB ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowOB(!showOB)}>
            <BookOpen size={16} />
          </button>
          <button className={`btn ${showTrade ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowTrade(!showTrade)}>
            {showTrade ? 'Hide Trade' : 'Trade'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-grid">
        {showTrade && <div className="detail-sidebar-backdrop" onClick={() => setShowTrade(false)} />}
        <div className="detail-main">
          {/* Indicators Toggle */}
          <div className="indicator-toggles">
            <button className={`indicator-btn ${showMA ? 'active' : ''}`} onClick={() => setShowMA(!showMA)}>
              <LineChart size={14} /> MA
            </button>
            <button className={`indicator-btn ${showBB ? 'active' : ''}`} onClick={() => setShowBB(!showBB)}>
              <Activity size={14} /> Bollinger
            </button>
            <button className={`indicator-btn ${showRSI ? 'active' : ''}`} onClick={() => setShowRSI(!showRSI)}>
              <TrendingUp size={14} /> RSI
            </button>
            <button className={`indicator-btn ${showMACD ? 'active' : ''}`} onClick={() => setShowMACD(!showMACD)}>
              <BarChart3 size={14} /> MACD
            </button>
          </div>

          {/* Price Chart */}
          <div className="panel glass chart-panel">
            <div className="panel-header">
              <div className="panel-title-row">
                <Activity size={18} />
                <h2>{stock.symbol} · Candlestick</h2>
              </div>
              <div className="range-selector">
                {(['1W', '1M', '3M', '1Y'] as const).map(r => (
                  <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
                ))}
              </div>
            </div>
            <CandlestickChart
              data={candleData}
              indicators={indicators || undefined}
              showMA={showMA}
              showBB={showBB}
              showRSI={showRSI}
              showMACD={showMACD}
              colors={{ background: '#0d111c', text: '#7d879a', up: '#22c55e', down: '#ef4444' }}
            />
            {showRSI && (
              <RSIPanel data={candleData} rsi={indicators?.rsi14} />
            )}
            {showMACD && indicators?.macd && (
              <MACDPanel
                data={candleData}
                macdLine={indicators.macd.macd}
                signal={indicators.macd.signal}
                histogram={indicators.macd.histogram}
              />
            )}
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-mini glass">
              <DollarSign size={16} />
              <div>
                <span className="stat-mini-label">Open</span>
                <span className="stat-mini-value">
                  {candleData.length > 0 ? formatMoney(candleData[candleData.length - 1].open) : '--'}
                </span>
              </div>
            </div>
            <div className="stat-mini glass">
              <TrendingUp size={16} />
              <div>
                <span className="stat-mini-label">High</span>
                <span className="stat-mini-value">
                  {candleData.length > 0 ? formatMoney(Math.max(...candleData.map(c => c.high))) : '--'}
                </span>
              </div>
            </div>
            <div className="stat-mini glass">
              <TrendingDown size={16} />
              <div>
                <span className="stat-mini-label">Low</span>
                <span className="stat-mini-value">
                  {candleData.length > 0 ? formatMoney(Math.min(...candleData.map(c => c.low))) : '--'}
                </span>
              </div>
            </div>
            <div className="stat-mini glass">
              <BarChart3 size={16} />
              <div>
                <span className="stat-mini-label">Volume</span>
                <span className="stat-mini-value">{formatLarge(stock.volume || 0)}</span>
              </div>
            </div>
            <div className="stat-mini glass">
              <Building2 size={16} />
              <div>
                <span className="stat-mini-label">Market Cap</span>
                <span className="stat-mini-value">{formatLarge(stock.marketCap || 0)}</span>
              </div>
            </div>
            <div className="stat-mini glass">
              <Globe size={16} />
              <div>
                <span className="stat-mini-label">Sector</span>
                <span className="stat-mini-value">{stock.sector || '--'}</span>
              </div>
            </div>
          </div>

          {/* Order Book */}
          {showOB && <OrderBook stockId={stockId} API={API} formatMoney={formatMoney} />}

          {/* Price Alert */}
          <div className="panel glass alert-panel">
            <div className="panel-title-row">
              <Bell size={16} />
              <h2>Price Alert</h2>
            </div>
            <div className="alert-input-row">
              <div className="alert-direction-toggle">
                <button
                  className={`alert-dir-btn ${alertDirection === 'above' ? 'active up' : ''}`}
                  onClick={() => setAlertDirection('above')}
                >
                  <TrendingUp size={14} /> Above
                </button>
                <button
                  className={`alert-dir-btn ${alertDirection === 'below' ? 'active down' : ''}`}
                  onClick={() => setAlertDirection('below')}
                >
                  <TrendingDown size={14} /> Below
                </button>
              </div>
              <div className="alert-price-input">
                <input
                  type="number"
                  placeholder="Target price..."
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetAlert()}
                />
                <button className="btn btn-primary" onClick={handleSetAlert}>
                  <Bell size={14} /> Set Alert
                </button>
              </div>
            </div>
            {alertMsg && <div className="alert-success">{alertMsg}</div>}
          </div>
        </div>

        {/* Trading Panel Sidebar */}
        {showTrade && (
          <div className="detail-sidebar">
            <TradingPanel
              stock={stock}
              portfolio={portfolio}
              onTradeComplete={onTradeComplete}
              onClose={() => setShowTrade(false)}
              formatMoney={formatMoney}
              API={API}
              authFetch={authFetch}
            />
          </div>
        )}
      </div>
    </div>
  )
}
