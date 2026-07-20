import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, MessageCircle } from 'lucide-react'
import type { NewsItem } from '../App'

interface SentimentStock {
  symbol: string
  positive: number
  negative: number
  neutral: number
  total: number
  score: number // -1 to 1, where 1 = most bullish
}

interface Props {
  news: NewsItem[]
}

export default function SentimentOverview({ news }: Props) {
  const sentimentData = useMemo(() => {
    const map = new Map<string, SentimentStock>()

    for (const item of news) {
      if (!item.symbol) continue
      const sym = item.symbol

      if (!map.has(sym)) {
        map.set(sym, { symbol: sym, positive: 0, negative: 0, neutral: 0, total: 0, score: 0 })
      }

      const entry = map.get(sym)!
      entry.total++
      if (item.sentiment === 'positive') entry.positive++
      else if (item.sentiment === 'negative') entry.negative++
      else entry.neutral++
    }

    // Compute composite score: (positive - negative) / total → ranges from -1 to 1
    for (const entry of map.values()) {
      entry.score = entry.total > 0
        ? Number(((entry.positive - entry.negative) / entry.total).toFixed(2))
        : 0
    }

    // Sort: most bullish first
    return Array.from(map.values()).sort((a, b) => b.score - a.score)
  }, [news])

  if (sentimentData.length === 0) return null

  const getScoreColor = (score: number) => {
    if (score > 0.2) return 'var(--accent-green)'
    if (score < -0.2) return 'var(--accent-red)'
    return 'var(--accent-yellow)'
  }

  const getScoreLabel = (score: number) => {
    if (score > 0.3) return 'Bullish'
    if (score > 0.1) return 'Slightly Bullish'
    if (score < -0.3) return 'Bearish'
    if (score < -0.1) return 'Slightly Bearish'
    return 'Neutral'
  }

  const getScoreIcon = (score: number) => {
    if (score > 0.1) return TrendingUp
    if (score < -0.1) return TrendingDown
    return Minus
  }

  return (
    <div className="panel glass sentiment-overview">
      <div className="panel-header">
        <div className="panel-title-row">
          <MessageCircle size={18} />
          <h2>News Sentiment by Stock</h2>
        </div>
        <span className="sentiment-subtitle">
          Aggregated from {news.length} articles
        </span>
      </div>

      <div className="sentiment-grid">
        {sentimentData.map((stock, index) => {
          const ScoreIcon = getScoreIcon(stock.score)
          const scoreColor = getScoreColor(stock.score)
          const scoreLabel = getScoreLabel(stock.score)

          return (
            <div key={stock.symbol} className="sentiment-stock-row" style={{ '--i': index } as React.CSSProperties}>
              <div className="sentiment-stock-left">
                <span className="sentiment-symbol">{stock.symbol}</span>
                <div className="sentiment-articles-count">
                  <MessageCircle size={10} />
                  <span>{stock.total}</span>
                </div>
              </div>

              <div className="sentiment-bars">
                {stock.positive > 0 && (
                  <div
                    className="sentiment-bar positive"
                    style={{ width: `${(stock.positive / stock.total) * 100}%` }}
                    title={`${stock.positive} positive`}
                  />
                )}
                {stock.neutral > 0 && (
                  <div
                    className="sentiment-bar neutral"
                    style={{ width: `${(stock.neutral / stock.total) * 100}%` }}
                    title={`${stock.neutral} neutral`}
                  />
                )}
                {stock.negative > 0 && (
                  <div
                    className="sentiment-bar negative"
                    style={{ width: `${(stock.negative / stock.total) * 100}%` }}
                    title={`${stock.negative} negative`}
                  />
                )}
              </div>

              <div className="sentiment-score-wrapper">
                <div className="sentiment-score" style={{ color: scoreColor }}>
                  <ScoreIcon size={14} />
                  <span className="score-value">{stock.score > 0 ? '+' : ''}{stock.score.toFixed(2)}</span>
                </div>
                <span className="sentiment-label" style={{ color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sentiment-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-green)' }} />
          <span>Bullish</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-yellow)' }} />
          <span>Neutral</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent-red)' }} />
          <span>Bearish</span>
        </div>
      </div>
    </div>
  )
}
