import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Briefcase, Download, Activity, AlertTriangle } from 'lucide-react'
import { SkeletonPortfolio } from './SkeletonLoaders'
import { useFormattedCountUp } from '../utils/useCountUp'
import type { PortfolioData } from '../App'

interface Props {
  portfolio: PortfolioData | null
  onStockSelect: (id: number) => void
  formatMoney: (v: number) => string
  formatLarge: (v: number) => string
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export default function PortfolioView({ portfolio, onStockSelect, formatMoney, formatLarge }: Props) {
  const [showHeatmap, setShowHeatmap] = useState(false)

  if (!portfolio) return <SkeletonPortfolio />

  const isPositivePL = portfolio.totalPL >= 0

  // Sharpe Ratio calculation (simplified: using daily P&L as return proxy)
  const calculateSharpe = () => {
    if (portfolio.holdings.length === 0) return 0
    const returns = portfolio.holdings.map(h => h.plPercent / 100)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)
    if (stdDev === 0) return 0
    return avgReturn / stdDev
  }

  const sharpe = calculateSharpe()

  // Allocation data for pie chart
  const allocationData = portfolio.holdings.map(h => ({
    name: h.symbol,
    value: h.allocation || 0,
    fullValue: h.marketValue,
  }))

  // Performance simulation data (simulated daily values)
  const performanceData = useMemo(() => {
    const data = []
    const days = 30
    const baseValue = Number(portfolio.totalValue) * 0.85
    let value = baseValue
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const change = (Math.random() - 0.48) * 0.02 * value
      value = value + change
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(value * 100) / 100,
      })
    }
    return data
  }, [portfolio.totalValue])

  // Generate allocation data for heatmap view
  const heatmapData = portfolio.holdings.map(h => ({
    symbol: h.symbol,
    value: h.allocation || 0,
    pl: h.plPercent,
    plAbs: h.pl,
    color: h.pl >= 0
      ? `rgba(34, 197, 94, ${Math.min(Math.abs(h.plPercent) / 10, 1)})`
      : `rgba(239, 68, 68, ${Math.min(Math.abs(h.plPercent) / 10, 1)})`,
  }))

  // Export to CSV
  const exportPortfolio = () => {
    const headers = ['Symbol', 'Shares', 'Avg Price', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'Allocation %']
    const rows = portfolio.holdings.map(h => [
      h.symbol, h.shares, h.avgPrice, h.currentPrice, h.marketValue.toFixed(2),
      h.pl.toFixed(2), h.plPercent.toFixed(2), h.allocation.toFixed(1)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `stockflow_portfolio_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Animated portfolio values ──
  const animatedTotalValue = useFormattedCountUp(portfolio.totalValue, formatMoney, 1000)
  const animatedCashBalance = useFormattedCountUp(portfolio.cashBalance, formatMoney, 800)
  const animatedPL = useFormattedCountUp(portfolio.totalPL, formatMoney, 900)
  const animatedReturn = useFormattedCountUp(portfolio.totalReturnPercent, (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}% return`, 700)

  return (
    <div className="portfolio-view">
      {/* Summary Cards */}
      <div className="stat-grid">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Wallet size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Portfolio Value</span>
            <span className="stat-value count-up-value">{animatedTotalValue}</span>
            <span className="stat-detail">Total assets value</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper green">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Cash Balance</span>
            <span className="stat-value count-up-value">{animatedCashBalance}</span>
            <span className="stat-detail">Available for trading</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className={`stat-icon-wrapper ${isPositivePL ? 'green' : 'red'}`}>
            {isPositivePL ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          </div>
          <div className="stat-content">
            <span className="stat-label">Total P&L</span>
            <span className={`stat-value count-up-value ${isPositivePL ? 'green-text' : 'red-text'}`}>
              {isPositivePL ? '+' : ''}{animatedPL}
            </span>
            <span className={`stat-detail ${isPositivePL ? 'green-text' : 'red-text'}`}>
              {animatedReturn}
            </span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper purple">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Sharpe Ratio</span>
            <span className={`stat-value ${sharpe >= 0 ? 'green-text' : 'red-text'}`}>
              {sharpe.toFixed(2)}
            </span>
            <span className="stat-detail">{sharpe >= 1 ? 'Good' : sharpe >= 0.5 ? 'Fair' : 'Poor'} risk-adjusted return</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="panel glass">
        <div className="panel-header">
          <div className="panel-title-row">
            <TrendingUp size={18} />
            <h2>Portfolio Performance (30D)</h2>
          </div>
          <button className="btn btn-outline" onClick={exportPortfolio}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="perf-chart-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3e" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5e', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [formatMoney(value), 'Value']}
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings, Allocation, and Heatmap */}
      <div className="portfolio-grid">
        <div className="panel glass">
          <div className="panel-header">
            <div className="panel-title-row">
              <BarChart3 size={18} />
              <h2>Holdings</h2>
            </div>
            <div className="panel-actions">
              <button
                className={`heatmap-toggle ${showHeatmap ? 'active' : ''}`}
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <AlertTriangle size={14} /> Heatmap
              </button>
              <span className="holdings-count">{portfolio.holdings.length} positions</span>
            </div>
          </div>

          {showHeatmap ? (
            <div className="heatmap-grid">
              {heatmapData.map(h => (
                <div
                  key={h.symbol}
                  className="heatmap-cell"
                  style={{ backgroundColor: h.color, flex: h.value / 100 + 0.5 }}
                >
                  <strong>{h.symbol}</strong>
                  <span>{h.pl >= 0 ? '+' : ''}{h.pl.toFixed(2)}%</span>
                  <small>{h.value.toFixed(1)}%</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="holdings-table-wrapper">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th><th>Shares</th><th>Avg Price</th><th>Current</th><th>Market Value</th><th>P&L</th><th>Alloc</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h, i) => (
                    <tr key={h.stockId} className="holding-row" onClick={() => onStockSelect(h.stockId)} style={{ '--i': i } as React.CSSProperties}>
                      <td><span className="holding-symbol">{h.symbol}</span></td>
                      <td>{h.shares}</td>
                      <td>{formatMoney(h.avgPrice)}</td>
                      <td>{formatMoney(h.currentPrice)}</td>
                      <td><strong>{formatMoney(h.marketValue)}</strong></td>
                      <td>
                        <span className={`pl-badge ${h.pl >= 0 ? 'up' : 'down'}`}>
                          {h.pl >= 0 ? '+' : ''}{formatMoney(h.pl)}
                          <small>({h.plPercent >= 0 ? '+' : ''}{h.plPercent.toFixed(2)}%)</small>
                        </span>
                      </td>
                      <td><span className="alloc-bar"><span className="alloc-fill" style={{ width: `${Math.min(h.allocation, 100)}%` }} /></span></td>
                    </tr>
                  ))}
                  {portfolio.holdings.length === 0 && (
                    <tr><td colSpan={7} className="empty-row">No holdings yet. Start trading!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation Pie Chart */}
        <div className="panel glass">
          <div className="panel-header">
            <div className="panel-title-row">
              <PieChart width={18} height={18} />
              <h2>Allocation</h2>
            </div>
          </div>
          {allocationData.length > 0 ? (
            <div className="allocation-chart-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {allocationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid #2a3a5e', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: '#e2e8f0' }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Allocation']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="allocation-legend">
                {allocationData.map((d, i) => (
                  <div key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="legend-label">{d.name}</span>
                    <span className="legend-value">{d.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-text">No holdings data</p>
          )}
        </div>
      </div>
    </div>
  )
}
