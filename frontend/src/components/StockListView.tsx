import { Search, Star, TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import StockScreener from './StockScreener'
import type { Stock } from '../App'

interface Props {
  stocks: Stock[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onStockSelect: (id: number) => void
  watchlist: number[]
  onToggleWatchlist: (id: number) => void
  formatMoney: (v: number) => string
  formatLarge: (v: number) => string
  isWatchlist?: boolean
  priceFlash?: Map<number, 'up' | 'down'>
}

export default function StockListView({
  stocks, searchQuery, onSearchChange, onStockSelect,
  watchlist, onToggleWatchlist, formatMoney, formatLarge, isWatchlist, priceFlash
}: Props) {
  return (
    <div className="stock-list-view">
      <div className="stock-list-header">
        <div className="search-wrapper">
          <Search size={17} />
          <input
            type="text"
            placeholder={isWatchlist ? 'Filter watchlist...' : 'Search by name or symbol...'}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus={!isWatchlist}
          />
        </div>
        <div className="stock-count">
          {stocks.length} {isWatchlist ? 'watched' : ''} stocks
        </div>
      </div>

      <StockScreener stocks={stocks}>
        {(filtered) => (
          <div className="stock-table-wrapper">
            <table className="stock-table">
              <thead>
                <tr>
                  <th className="col-star"></th>
                  <th className="col-symbol">Symbol</th>
                  <th className="col-name">Name</th>
                  <th className="col-price">Price</th>
                  <th className="col-change">Change</th>
                  <th className="col-mcap">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((stock, i) => {
                  const handleClick = () => onStockSelect(stock.id)
                  return (
                    <tr key={stock.id} className="stock-row" onClick={handleClick} style={{ '--i': i } as React.CSSProperties}>
                      <td className="col-star" onClick={e => { e.stopPropagation(); }}>
                        <button
                          className={`star-btn ${watchlist.includes(stock.id) ? 'active' : ''}`}
                          onClick={e => { e.stopPropagation(); onToggleWatchlist(stock.id) }}
                        >
                          <Star size={14} fill={watchlist.includes(stock.id) ? '#f59e0b' : 'none'} />
                        </button>
                      </td>
                      <td className="col-symbol" onClick={handleClick}>
                        <span className="stock-symbol">{stock.symbol}</span>
                      </td>
                      <td className="col-name" onClick={handleClick}>
                        <span className="stock-name">{stock.name}</span>
                      </td>
                      <td className="col-price" onClick={handleClick}>
                        <span className={`stock-price ${priceFlash?.has(stock.id) ? 'flash-' + priceFlash.get(stock.id) : ''}`}>
                          {formatMoney(stock.currentPrice)}
                        </span>
                      </td>
                      <td className="col-change" onClick={handleClick}>
                        <div className={`change-badge ${stock.changePercent >= 0 ? 'up' : 'down'} ${priceFlash?.has(stock.id) ? 'badge-flash-' + priceFlash.get(stock.id) : ''}`}>
                          {stock.changePercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="col-mcap" onClick={handleClick}>
                        <span className="stock-mcap">{formatLarge(stock.marketCap)}</span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      {isWatchlist
                        ? 'No stocks in your watchlist. Star stocks from the All Stocks view.'
                        : 'No stocks match your filters.'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </StockScreener>
    </div>
  )
}
