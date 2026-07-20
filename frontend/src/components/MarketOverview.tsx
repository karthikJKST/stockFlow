import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'
import type { MarketData, NewsItem } from '../App'
import SentimentOverview from './SentimentOverview'
import { useCountUp, useFormattedCountUp } from '../utils/useCountUp'

interface Props {
  marketData: MarketData
  news: NewsItem[]
  onStockSelect: (id: number) => void
  formatMoney: (v: number) => string
  formatLarge: (v: number) => string
  priceFlash?: Map<number, 'up' | 'down'>
}

/** Renders a single index card with animated value */
function IndexCard({ name, symbol, value, change, changePercent }: {
  name: string; symbol: string; value: number; change: number; changePercent: number
}) {
  const animatedValue = useFormattedCountUp(value,
    (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 900)

  return (
    <div className="index-card">
      <div className="index-info">
        <span className="index-name">{name}</span>
        <span className="index-symbol">{symbol}</span>
      </div>
      <div className="index-values">
        <span className="index-value count-up-value">{animatedValue}</span>
        <span className={`index-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default function MarketOverview({ marketData, news, onStockSelect, formatMoney, formatLarge, priceFlash }: Props) {
  const { indices, totalStocks, totalVolume, advancers, decliners, topGainers, topLosers } = marketData

  // Animated stat values (hooks at top level, not in loops)
  const animatedAdvancers = useCountUp(advancers, 600)
  const animatedDecliners = useCountUp(decliners, 600)
  const animatedVolume = useFormattedCountUp(totalVolume, formatLarge, 700)

  return (
    <div className="market-overview">
      {/* Indices Strip */}
      <div className="indices-strip">
        {indices.map(index => (
          <IndexCard key={index.symbol} {...index} />
        ))}
      </div>

      {/* Market Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <BarChart3 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Stocks</span>
            <span className="stat-value">{totalStocks}</span>
            <span className="stat-detail">Tracked companies</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper green">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Volume (24h)</span>
            <span className="stat-value count-up-value">{animatedVolume}</span>
            <span className="stat-detail">Total shares traded</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper green">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Advancers</span>
            <span className="stat-value green-text count-up-value">{Math.round(animatedAdvancers)}</span>
            <span className="stat-detail">Stocks rising today</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper red">
            <TrendingDown size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Decliners</span>
            <span className="stat-value red-text count-up-value">{Math.round(animatedDecliners)}</span>
            <span className="stat-detail">Stocks falling today</span>
          </div>
        </div>
      </div>

      {/* Gainers & Losers */}
      <div className="movers-grid">
        <div className="panel glass">
          <div className="panel-header">
            <div className="panel-title-row">
              <ArrowUpRight size={18} className="green-text" />
              <h2>Top Gainers</h2>
            </div>
          </div>
          <div className="mover-list">
            {topGainers.map((stock, i) => (
              <div key={stock.id} className="mover-item" onClick={() => onStockSelect(stock.id)} style={{ '--i': i } as React.CSSProperties}>
                <div className="mover-rank">#{i + 1}</div>
                <div className="mover-info">
                  <strong>{stock.symbol}</strong>
                  <span>{stock.name}</span>
                </div>
                <div className={`mover-price ${priceFlash?.has(stock.id) ? 'flash-' + priceFlash.get(stock.id) : ''}`}>{formatMoney(stock.currentPrice)}</div>
                <div className={`mover-change positive ${priceFlash?.has(stock.id) ? 'badge-flash-' + priceFlash.get(stock.id) : ''}`}>
                  <ArrowUpRight size={14} />
                  +{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
            {topGainers.length === 0 && <p className="empty-text">No gainers data</p>}
          </div>
        </div>

        <div className="panel glass">
          <div className="panel-header">
            <div className="panel-title-row">
              <ArrowDownRight size={18} className="red-text" />
              <h2>Top Losers</h2>
            </div>
          </div>
          <div className="mover-list">
            {topLosers.map((stock, i) => (
              <div key={stock.id} className="mover-item" onClick={() => onStockSelect(stock.id)} style={{ '--i': i } as React.CSSProperties}>
                <div className="mover-rank">#{i + 1}</div>
                <div className="mover-info">
                  <strong>{stock.symbol}</strong>
                  <span>{stock.name}</span>
                </div>
                <div className={`mover-price ${priceFlash?.has(stock.id) ? 'flash-' + priceFlash.get(stock.id) : ''}`}>{formatMoney(stock.currentPrice)}</div>
                <div className={`mover-change negative ${priceFlash?.has(stock.id) ? 'badge-flash-' + priceFlash.get(stock.id) : ''}`}>
                  <ArrowDownRight size={14} />
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
            {topLosers.length === 0 && <p className="empty-text">No losers data</p>}
          </div>
        </div>
      </div>

      {/* News Sentiment Analysis */}
      <SentimentOverview news={news} />
    </div>
  )
}
