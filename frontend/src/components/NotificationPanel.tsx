import { useEffect, useRef, useState } from 'react'
import { Bell, TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react'
import type { NewsItem } from '../App'

interface Props {
  news: NewsItem[]
  onClose: () => void
  formatMoney: (v: number) => string
}

type Alert = {
  stockId: number
  symbol: string
  price: number
  direction?: 'above' | 'below'
  createdAt: number
}

export default function NotificationPanel({ news, onClose, formatMoney }: Props) {
  // Read alerts directly from localStorage so they're always fresh
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const saved = localStorage.getItem('stockflow_alerts')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div className="notification-panel" ref={ref}>
      <div className="notification-header">
        <Bell size={16} />
        <span>Notifications</span>
        <button className="notification-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* Price Alerts */}
      {alerts.length > 0 && (
        <div className="notification-section">
          <div className="notification-section-title">
            <AlertTriangle size={12} />
            Price Alerts
            <span className="notification-count">{alerts.length}</span>
          </div>
          {alerts.slice(-10).reverse().map((alert, i) => {
            const originalIndex = alerts.length - 1 - i
            const dir = alert.direction || 'above'
            return (
              <div key={`${alert.stockId}-${alert.price}-${i}`} className="notification-item">
                <div className={`notification-icon ${dir === 'above' ? 'positive' : 'negative'}`}>
                  {dir === 'above' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                </div>
                <div className="notification-content">
                  <strong>{alert.symbol}</strong>
                  <span className="alert-price-dir">
                    {dir === 'above' ? '↑ Above' : '↓ Below'} {formatMoney(alert.price)}
                  </span>
                  <small>{new Date(alert.createdAt).toLocaleDateString()}</small>
                </div>
                <button
                  className="alert-delete-btn"
                  onClick={() => {
                    const updated = alerts.filter((_, idx) => idx !== originalIndex)
                    setAlerts(updated)
                    localStorage.setItem('stockflow_alerts', JSON.stringify(updated))
                  }}
                  title="Remove alert"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent News */}
      <div className="notification-section">
        <div className="notification-section-title">
          <TrendingUp size={12} />
          Market News
        </div>
        {news.slice(0, 5).map(item => (
          <div key={item.id} className="notification-item">
            <div className={`notification-icon ${item.sentiment}`}>
              {item.sentiment === 'positive' ? <TrendingUp size={12} /> :
               item.sentiment === 'negative' ? <TrendingDown size={12} /> :
               <TrendingUp size={12} />}
            </div>
            <div className="notification-content">
              <strong>{item.headline}</strong>
              <small>{item.source} · {item.symbol || 'Market'}</small>
            </div>
          </div>
        ))}
        {news.length === 0 && alerts.length === 0 && (
          <div className="notification-empty">No notifications yet</div>
        )}
      </div>
    </div>
  )
}
