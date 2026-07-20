import { useState, useEffect, useRef, useCallback } from 'react'
import { X, BarChart3, Search, ArrowUpDown, GitCompare } from 'lucide-react'
import { createChart, ColorType, type IChartApi, type LineData, type Time } from 'lightweight-charts'
import type { Stock, Candle } from '../App'

const COMPARE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e']

interface CompareStock {
  id: number
  symbol: string
  name: string
  currentPrice: number
  changePercent: number
  marketCap: number
  priceHistory: Candle[]
  high52w: number
  low52w: number
}

interface Props {
  stocks: Stock[]
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  API: string
  formatMoney: (v: number) => string
  formatLarge: (v: number) => string
  onStockSelect: (id: number) => void
}

export default function CompareView({ stocks, authFetch, API, formatMoney, formatLarge, onStockSelect }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [compareData, setCompareData] = useState<CompareStock[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  // Fetch comparison data when selection changes
  const fetchCompare = useCallback(async () => {
    if (selected.length < 2) {
      setCompareData([])
      return
    }
    setLoading(true)
    try {
      const res = await authFetch(`${API}/stocks/compare?ids=${selected.join(',')}`)
      if (res.ok) setCompareData(await res.json())
    } catch {}
    setLoading(false)
  }, [selected, authFetch, API])

  useEffect(() => { fetchCompare() }, [fetchCompare])

  const toggleStock = (id: number) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  // ── Chart ──
  useEffect(() => {
    if (!chartContainerRef.current || compareData.length < 2) {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }
      return
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d111c' },
        textColor: '#7d879a',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a2235', style: 2 },
        horzLines: { color: '#1a2235', style: 2 },
      },
      timeScale: {
        borderColor: '#1e2a3e',
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#1e2a3e',
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      crosshair: {
        mode: 2,
        vertLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
        horzLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 420,
    })

    // Normalize prices to percentage change from start (for fair comparison)
    compareData.forEach((stock, idx) => {
      const color = COMPARE_COLORS[idx % COMPARE_COLORS.length]
      const prices = stock.priceHistory
      if (prices.length === 0) return

      const basePrice = prices[0].close
      const lineData: LineData[] = prices.map(c => ({
        time: (c.timestamp / 1000) as Time,
        value: basePrice !== 0 ? ((c.close - basePrice) / basePrice) * 100 : 0,
      }))

      chart.addLineSeries({
        color,
        lineWidth: 2,
        title: stock.symbol,
        lastValueVisible: true,
        priceLineVisible: false,
      }).setData(lineData)
    })

    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [compareData])

  const filteredSearch = stocks.filter(s =>
    s.symbol.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQ.toLowerCase())
  ).filter(s => !selected.includes(s.id))

  return (
    <div className="compare-view">
      {/* Selector */}
      <div className="panel glass compare-selector">
        <div className="panel-header">
          <div className="panel-title-row">
            <GitCompare size={18} />
            <h2>Compare Stocks</h2>
          </div>
          <span className="compare-hint">Select 2–3 stocks to compare performance</span>
        </div>

        {/* Selected chips */}
        <div className="compare-chips">
          {selected.map(id => {
            const stock = stocks.find(s => s.id === id)
            const idx = selected.indexOf(id)
            return (
              <div
                key={id}
                className="compare-chip"
                style={{ borderColor: COMPARE_COLORS[idx] + '60' }}
              >
                <span className="chip-dot" style={{ background: COMPARE_COLORS[idx] }} />
                <span className="chip-symbol">{stock?.symbol || `ID ${id}`}</span>
                <button className="chip-remove" onClick={() => toggleStock(id)}>
                  <X size={12} />
                </button>
              </div>
            )
          })}
          {selected.length === 0 && (
            <span className="compare-placeholder">Search and click a stock below to add it</span>
          )}
          {selected.length > 0 && selected.length < 3 && (
            <span className="compare-add-hint">{3 - selected.length} more slot{3 - selected.length > 1 ? 's' : ''} available</span>
          )}
        </div>

        {/* Search */}
        <div className="compare-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {selected.length >= 2 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setSelected([]); setCompareData([]) }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Stock picker grid */}
        {searchQ && (
          <div className="compare-picker-grid">
            {filteredSearch.slice(0, 8).map((stock, i) => (
              <button
                key={stock.id}
                className="compare-pick-btn"
                onClick={() => toggleStock(stock.id)}
                disabled={selected.length >= 3 && !selected.includes(stock.id)}
                style={{ '--i': i } as React.CSSProperties}
              >
                <strong>{stock.symbol}</strong>
                <span>{stock.name}</span>
                <span className="pick-price">{formatMoney(stock.currentPrice)}</span>
                <span className={`pick-change ${stock.changePercent >= 0 ? 'up' : 'down'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </button>
            ))}
            {filteredSearch.length === 0 && <span className="compare-no-match">No stocks match</span>}
          </div>
        )}
      </div>

      {/* Chart */}
      {compareData.length >= 2 && (
        <div className="panel glass compare-chart-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <BarChart3 size={18} />
              <h2>Performance Comparison (Normalized)</h2>
            </div>
            <div className="compare-legend">
              {compareData.map((stock, idx) => (
                <span key={stock.id} className="compare-legend-item">
                  <span className="legend-line" style={{ background: COMPARE_COLORS[idx % COMPARE_COLORS.length] }} />
                  {stock.symbol}
                </span>
              ))}
            </div>
          </div>
          <div ref={chartContainerRef} className="compare-chart-container" />
        </div>
      )}

      {/* Comparison Table */}
      {compareData.length >= 2 && (
        <div className="panel glass compare-table-panel">
          <div className="panel-header">
            <div className="panel-title-row">
              <ArrowUpDown size={18} />
              <h2>Side-by-Side Comparison</h2>
            </div>
          </div>
          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareData.map((stock, idx) => (
                    <th key={stock.id} style={{ color: COMPARE_COLORS[idx % COMPARE_COLORS.length] }}>
                      {stock.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="compare-metric">Price</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">{formatMoney(s.currentPrice)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">Change</td>
                  {compareData.map(s => (
                    <td key={s.id} className={`compare-value ${s.changePercent >= 0 ? 'up' : 'down'}`}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">Market Cap</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">{formatLarge(s.marketCap)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">52W High</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">{formatMoney(s.high52w)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">52W Low</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">{formatMoney(s.low52w)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">Range</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">
                      {s.high52w > 0 && s.high52w !== s.low52w ? ((s.currentPrice - s.low52w) / (s.high52w - s.low52w) * 100).toFixed(1) + '%' : '--'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="compare-metric">Candles</td>
                  {compareData.map(s => (
                    <td key={s.id} className="compare-value">{s.priceHistory.length.toLocaleString()}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compareData.length < 2 && !loading && (
        <div className="compare-empty-state">
          <GitCompare size={48} />
          <h3>Select at least 2 stocks to compare</h3>
          <p>Search for stocks above and click to add them. Up to 3 stocks can be compared at once.</p>
        </div>
      )}
    </div>
  )
}
