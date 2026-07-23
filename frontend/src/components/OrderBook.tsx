import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'

interface OrderLevel {
  price: number
  size: number
  total: number
}

interface OrderBookData {
  symbol: string
  currentPrice: number
  bids: OrderLevel[]
  asks: OrderLevel[]
}

interface Props {
  stockId: number
  API: string
  formatMoney: (v: number) => string
}

export default function OrderBook({ stockId, API, formatMoney }: Props) {
  const [data, setData] = useState<OrderBookData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/stocks/${stockId}/orderbook`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [stockId, API])

  if (loading) return <div className="orderbook-loading">Loading order book...</div>
  if (!data) return null

  const maxSize = Math.max(
    ...data.bids.map(b => b.size),
    ...data.asks.map(a => a.size)
  )

  return (
    <div className="orderbook glass">
      <div className="panel-header">
        <div className="panel-title-row">
          <BookOpen size={16} />
          <h2>Order Book</h2>
        </div>
        <span className="orderbook-spread">
          Spread: {((data.asks[0]?.price || 0) - (data.bids[0]?.price || 0)).toFixed(2)}
        </span>
      </div>

      {/* Header */}
      <div className="ob-header">
        <span className="ob-col">Price</span>
        <span className="ob-col">Size</span>
        <span className="ob-col">Total</span>
      </div>

      {/* Asks (reversed so best ask is at bottom) */}
      <div className="ob-asks">
        {[...data.asks].reverse().map((level, i) => (
          <div key={i} className="ob-row ask">
            <div className="ob-bar ask-bar" style={{ width: `${(level.size / maxSize) * 100}%` }} />
            <span className="ob-price red-text">{formatMoney(level.price)}</span>
            <span className="ob-size">{level.size.toLocaleString()}</span>
            <span className="ob-total">{formatMoney(level.total)}</span>
          </div>
        ))}
      </div>

      {/* Current Price */}
      <div className="ob-current">
        <span className="current-price-small">{formatMoney(data.currentPrice)}</span>
      </div>

      {/* Bids */}
      <div className="ob-bids">
        {data.bids.map((level, i) => (
          <div key={i} className="ob-row bid">
            <div className="ob-bar bid-bar" style={{ width: `${(level.size / maxSize) * 100}%` }} />
            <span className="ob-price green-text">{formatMoney(level.price)}</span>
            <span className="ob-size">{level.size.toLocaleString()}</span>
            <span className="ob-total">{formatMoney(level.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
