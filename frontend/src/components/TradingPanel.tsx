import { useState } from 'react'
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import type { StockDetail, PortfolioData } from '../App'
import { useToast } from './Toast'

interface Props {
  stock: StockDetail
  portfolio: PortfolioData | null
  onTradeComplete: () => void
  onClose?: () => void
  formatMoney: (v: number) => string
  API: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

type OrderType = 'BUY' | 'SELL'

export function TradingPanel({ stock, portfolio, onTradeComplete, onClose, formatMoney, API, authFetch }: Props) {
  const { success, error } = useToast()
  const [orderType, setOrderType] = useState<OrderType>('BUY')
  const [shares, setShares] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currentHolding = portfolio?.holdings.find(h => h.stockId === stock.id)
  const totalCost = stock.currentPrice * shares
  const canBuy = (portfolio?.cashBalance || 0) >= totalCost
  const canSell = (currentHolding?.shares || 0) >= shares

  const handleTrade = async () => {
    if (shares <= 0) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await authFetch(`${API}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockId: stock.id, type: orderType, shares })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        success(data.message)
        onTradeComplete()
      } else {
        setMessage({ type: 'error', text: data.message || 'Trade failed' })
        error(data.message || 'Trade failed')
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not connect to server' })
    }
    setLoading(false)
  }

  return (
    <div className="trading-panel glass">
      <div className="panel-header">
        <div className="panel-title-row">
          <DollarSign size={18} />
          <h2>Quick Trade</h2>
        </div>
        <button className="trade-close-btn" onClick={onClose} title="Minimize">
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="order-type-toggle">
        <button
          className={`order-btn ${orderType === 'BUY' ? 'buy active' : ''}`}
          onClick={() => setOrderType('BUY')}
        >
          <ArrowUpRight size={16} />
          Buy
        </button>
        <button
          className={`order-btn ${orderType === 'SELL' ? 'sell active' : ''}`}
          onClick={() => setOrderType('SELL')}
        >
          <ArrowDownRight size={16} />
          Sell
        </button>
      </div>

      {/* Price Display */}
      <div className="trade-price-info">
        <div className="trade-price-row">
          <span>Market Price</span>
          <strong>{formatMoney(stock.currentPrice)}</strong>
        </div>
        <div className="trade-price-row">
          <span>Day Change</span>
          <span className={stock.changePercent >= 0 ? 'green-text' : 'red-text'}>
            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Shares Input */}
      <div className="trade-input-group">
        <label>Shares</label>
        <div className="input-with-controls">
          <button
            className="qty-btn"
            onClick={() => setShares(Math.max(1, shares - 1))}
            disabled={shares <= 1}
          >
            −
          </button>
          <input
            type="number"
            value={shares}
            onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
          />
          <button
            className="qty-btn"
            onClick={() => setShares(shares + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="quick-amounts">
        {[1, 10, 25, 50, 100].map(n => (
          <button
            key={n}
            className={`qty-preset ${shares === n ? 'active' : ''}`}
            onClick={() => setShares(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Order Summary */}
      <div className="trade-summary">
        <div className="summary-row">
          <span>Estimated Cost</span>
          <strong>{formatMoney(totalCost)}</strong>
        </div>
        <div className="summary-row">
          <span>{orderType === 'BUY' ? 'Cash Balance' : 'Holdings'}</span>
          <strong>
            {orderType === 'BUY'
              ? formatMoney(portfolio?.cashBalance || 0)
              : `${currentHolding?.shares || 0} shares`
            }
          </strong>
        </div>
        {currentHolding && (
          <div className="summary-row">
            <span>Current Position</span>
            <strong>
              {currentHolding.shares} shares @ {formatMoney(currentHolding.avgPrice)}
            </strong>
          </div>
        )}
        <div className="summary-row total">
          <span>{orderType === 'BUY' ? 'Remaining Cash' : 'Remaining Shares'}</span>
          <strong>
            {orderType === 'BUY'
              ? formatMoney(Math.max(0, (portfolio?.cashBalance || 0) - totalCost))
              : Math.max(0, (currentHolding?.shares || 0) - shares)
            }
          </strong>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`trade-message ${message.type}`}>
          {message.type === 'success'
            ? <CheckCircle size={16} />
            : <XCircle size={16} />
          }
          {message.text}
        </div>
      )}

      {/* Execute Button */}
      <button
        className={`btn btn-block ${orderType === 'BUY' ? 'btn-buy' : 'btn-sell'}`}
        onClick={handleTrade}
        disabled={loading || (orderType === 'BUY' ? !canBuy : !canSell) || shares <= 0}
      >
        {loading ? (
          'Processing...'
        ) : (
          `${orderType === 'BUY' ? 'Buy' : 'Sell'} ${shares} shares`
        )}
      </button>

      {orderType === 'BUY' && !canBuy && (
        <p className="trade-warning">Insufficient cash balance</p>
      )}
      {orderType === 'SELL' && !canSell && (
        <p className="trade-warning">Insufficient shares in portfolio</p>
      )}
    </div>
  )
}
