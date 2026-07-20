import { useState, useMemo } from 'react'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import type { Stock } from '../App'

interface Props {
  stocks: Stock[]
  children: (filtered: Stock[]) => React.ReactNode
}

export default function StockScreener({ stocks, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [sector, setSector] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [changeMin, setChangeMin] = useState('')
  const [changeMax, setChangeMax] = useState('')
  const [sortBy, setSortBy] = useState<'symbol' | 'currentPrice' | 'changePercent'>('changePercent')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sectors = useMemo(() => [...new Set(stocks.map(s => s.name.split(' ').slice(-1)[0]).filter(Boolean))], [stocks])

  const filtered = useMemo(() => {
    return stocks
      .filter(s => {
        if (sector && !s.name.includes(sector) && s.name.split(' ').slice(-1)[0] !== sector && s.symbol !== sector) return false
        if (priceMin && s.currentPrice < Number(priceMin)) return false
        if (priceMax && s.currentPrice > Number(priceMax)) return false
        if (changeMin && s.changePercent < Number(changeMin)) return false
        if (changeMax && s.changePercent > Number(changeMax)) return false
        return true
      })
      .sort((a, b) => {
        const aVal = a[sortBy] as number
        const bVal = b[sortBy] as number
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal
      })
  }, [stocks, sector, priceMin, priceMax, changeMin, changeMax, sortBy, sortDir])

  const clearFilters = () => {
    setSector(''); setPriceMin(''); setPriceMax('')
    setChangeMin(''); setChangeMax('')
  }

  const hasFilters = sector || priceMin || priceMax || changeMin || changeMax

  return (
    <div className="screener-container">
      <div className="screener-toolbar">
        <button className="screener-toggle" onClick={() => setIsOpen(!isOpen)}>
          <Filter size={15} />
          Screener
          {hasFilters && <span className="filter-count">!</span>}
        </button>

        {hasFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}

        <div className="screener-sort">
          <SlidersHorizontal size={14} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="changePercent">Change %</option>
            <option value="currentPrice">Price</option>
            <option value="symbol">Symbol</option>
          </select>
          <button className="sort-dir-btn" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <span className="screener-count">{filtered.length} results</span>
      </div>

      {isOpen && (
        <div className="screener-panel glass">
          <div className="screener-fields">
            <div className="screener-field">
              <label>Min Price</label>
              <input type="number" placeholder="$0" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
            </div>
            <div className="screener-field">
              <label>Max Price</label>
              <input type="number" placeholder="$1000" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
            </div>
            <div className="screener-field">
              <label>Min Change %</label>
              <input type="number" placeholder="-10" value={changeMin} onChange={e => setChangeMin(e.target.value)} />
            </div>
            <div className="screener-field">
              <label>Max Change %</label>
              <input type="number" placeholder="+10" value={changeMax} onChange={e => setChangeMax(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {children(filtered)}
    </div>
  )
}
