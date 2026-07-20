import { useState } from 'react'
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, Clock, Filter, Hash } from 'lucide-react'
import type { NewsItem, Stock } from '../App'

interface Props {
  news: NewsItem[]
  stocks: Stock[]
  formatLarge: (v: number) => string
}

const sentimentConfig = {
  positive: { color: '#22c55e', bg: '#22c55e15', icon: TrendingUp, label: 'Bullish' },
  negative: { color: '#ef4444', bg: '#ef444415', icon: TrendingDown, label: 'Bearish' },
  neutral: { color: '#f59e0b', bg: '#f59e0b15', icon: Minus, label: 'Neutral' },
} as const

export default function NewsFeed({ news, stocks, formatLarge }: Props) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')

  const filteredNews = news.filter(item => {
    if (filter !== 'all' && item.sentiment !== filter) return false
    if (selectedSymbol && item.symbol !== selectedSymbol) return false
    return true
  })

  const uniqueSymbols = [...new Set(news.filter(n => n.symbol).map(n => n.symbol))]

  return (
    <div className="news-feed-view">
      {/* Filters */}
      <div className="news-filters">
        <div className="filter-tabs">
          {(['all', 'positive', 'negative', 'neutral'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All News' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {uniqueSymbols.length > 0 && (
          <div className="symbol-filter">
            <Hash size={14} />
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
            >
              <option value="">All Symbols</option>
              {uniqueSymbols.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* News Grid */}
      <div className="news-grid">
        {filteredNews.map((item, index) => {
          const config = sentimentConfig[item.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral
          const SentimentIcon = config.icon
          return (
            <article key={item.id} className="news-card glass" style={{ borderLeftColor: config.color, '--i': index } as React.CSSProperties}>
              <div className="news-card-header">
                <span className="news-source">{item.source}</span>
                <span className="news-time">
                  <Clock size={11} />
                  {getRelativeTime(item.timestamp)}
                </span>
              </div>
              <h3 className="news-headline">{item.headline}</h3>
              <p className="news-summary">{item.summary}</p>
              <div className="news-card-footer">
                <div className="sentiment-badge" style={{ backgroundColor: config.bg, color: config.color }}>
                  <SentimentIcon size={12} />
                  {config.label}
                </div>
                {item.symbol && (
                  <span className="news-symbol-tag">{item.symbol}</span>
                )}
              </div>
            </article>
          )
        })}
        {filteredNews.length === 0 && (
          <div className="empty-state">
            <Newspaper size={40} />
            <p>No news articles match your filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
