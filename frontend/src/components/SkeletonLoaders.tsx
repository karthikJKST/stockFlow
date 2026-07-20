import { Activity, BarChart3, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'

/** A pulsing placeholder bar */
function SkeletonBar({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton-bar"
      style={{ width: typeof width === 'number' ? `${width}px` : width, height, ...style }}
    />
  )
}

/** A circular placeholder */
function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <div className="skeleton-circle" style={{ width: size, height: size }} />
}

/** Skeleton for an index card in the market strip */
export function SkeletonIndexCard() {
  return (
    <div className="skeleton-index-card">
      <div style={{ display: 'grid', gap: 6 }}>
        <SkeletonBar width={50} height={10} />
        <SkeletonBar width={70} height={14} />
      </div>
      <div style={{ display: 'grid', gap: 6, alignItems: 'end', textAlign: 'right' }}>
        <SkeletonBar width={80} height={14} />
        <SkeletonBar width={50} height={12} />
      </div>
    </div>
  )
}

/** Skeleton for a stat card */
export function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card" style={{ display: 'flex', gap: 14, padding: 20 }}>
      <SkeletonCircle size={44} />
      <div style={{ display: 'grid', gap: 6, flex: 1 }}>
        <SkeletonBar width={80} height={11} />
        <SkeletonBar width={120} height={22} />
        <SkeletonBar width={100} height={10} />
      </div>
    </div>
  )
}

/** Skeleton for the market overview page */
export function SkeletonMarketOverview() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="indices-strip" style={{ opacity: 1 }}>
        {[1, 2, 3, 4, 5].map(i => <SkeletonIndexCard key={i} />)}
      </div>
      <div className="stat-grid">
        {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} className="skeleton-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Activity size={18} className="skeleton-icon" />
              <SkeletonBar width={100} height={14} />
            </div>
            {[1, 2, 3, 4, 5].map(j => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                <SkeletonBar width={24} height={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonBar width={60} height={14} />
                  <SkeletonBar width={120} height={10} />
                </div>
                <SkeletonBar width={80} height={13} />
                <SkeletonBar width={70} height={12} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for the stock list view */
export function SkeletonStockList() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <SkeletonBar width={320} height={40} style={{ borderRadius: 8 }} />
        <SkeletonBar width={80} height={14} />
      </div>
      <div className="skeleton-panel" style={{ borderRadius: 12 }}>
        <div style={{ display: 'grid', gap: 0 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <SkeletonCircle size={20} />
              <SkeletonBar width={60} height={14} />
              <SkeletonBar width={160} height={12} style={{ flex: 1 }} />
              <SkeletonBar width={90} height={13} />
              <SkeletonBar width={70} height={12} style={{ borderRadius: 4 }} />
              <SkeletonBar width={80} height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Skeleton for portfolio view */
export function SkeletonPortfolio() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="stat-grid">
        {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="skeleton-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={18} className="skeleton-icon" />
          <SkeletonBar width={180} height={14} />
        </div>
        <SkeletonBar width="100%" height={200} style={{ borderRadius: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="skeleton-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} className="skeleton-icon" />
            <SkeletonBar width={100} height={14} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <SkeletonBar width={60} height={14} />
              <SkeletonBar width={40} height={14} />
              <SkeletonBar width={70} height={14} />
              <SkeletonBar width={70} height={14} />
              <SkeletonBar width={80} height={14} />
              <SkeletonBar width={90} height={14} />
            </div>
          ))}
        </div>
        <div className="skeleton-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Briefcase size={18} className="skeleton-icon" />
            <SkeletonBar width={100} height={14} />
          </div>
          <SkeletonBar width="100%" height={200} style={{ borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}

/** Skeleton for stock detail view */
export function SkeletonStockDetail() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <SkeletonCircle size={56} />
          <div style={{ display: 'grid', gap: 6 }}>
            <SkeletonBar width={200} height={22} />
            <SkeletonBar width={140} height={14} />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <SkeletonBar width={120} height={28} />
            <SkeletonBar width={80} height={14} />
          </div>
        </div>
      </div>
      <div className="skeleton-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={18} className="skeleton-icon" />
          <SkeletonBar width={160} height={15} />
        </div>
        <SkeletonBar width="100%" height={400} style={{ borderRadius: 8 }} />
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-stat-mini" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <SkeletonCircle size={20} />
            <div style={{ display: 'grid', gap: 4 }}>
              <SkeletonBar width={40} height={10} />
              <SkeletonBar width={70} height={13} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
