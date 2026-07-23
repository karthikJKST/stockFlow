import { useEffect, useRef, memo } from 'react'
import { createChart, ColorType, type IChartApi, type ISeriesApi, type CandlestickData, type LineData, type HistogramData, type Time, type MouseEventParams } from 'lightweight-charts'
import type { Candle } from '../App'

interface IndicatorData {
  timestamps?: number[]
  sma20?: (number | null)[]
  sma50?: (number | null)[]
  rsi14?: (number | null)[]
  macd?: { macd?: (number | null)[]; signal?: (number | null)[]; histogram?: (number | null)[] }
  bollinger?: { upper?: (number | null)[]; middle?: (number | null)[]; lower?: (number | null)[] }
}

interface Props {
  data: Candle[]
  indicators?: IndicatorData
  colors?: { background?: string; text?: string; up?: string; down?: string }
  height?: number
  showMA?: boolean
  showBB?: boolean
  showRSI?: boolean
  showMACD?: boolean
}

type TooltipInfo = {
  time: string
  open: string
  high: string
  low: string
  close: string
  volume: string
  change: string
  changePct: string
  x: number
  y: number
} | null

export default memo(function CandlestickChart({ data, indicators, colors, height = 420, showMA = true, showBB = false, showRSI = false, showMACD = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map())
  const dataRef = useRef<Candle[]>(data)

  // Keep a ref to latest data for tooltip callback
  dataRef.current = data

  const bg = colors?.background || '#0d111c'
  const txt = colors?.text || '#7d879a'
  const upColor = colors?.up || '#22c55e'
  const downColor = colors?.down || '#ef4444'

  // ── Create chart once on mount ──
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: txt,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1a2235', style: 2 },
        horzLines: { color: '#1a2235', style: 2 },
      },
      timeScale: {
        borderColor: '#1e2a3e',
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#1e2a3e',
        scaleMargins: { top: 0.05, bottom: 0.2 },
      },
      crosshair: {
        mode: 2,
        vertLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
        horzLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
      },
      width: containerRef.current.clientWidth,
      height,
    })

    // Candlestick series (persistent)
    const cs = chart.addCandlestickSeries({
      upColor,
      downColor,
      borderUpColor: upColor,
      borderDownColor: downColor,
      wickUpColor: upColor,
      wickDownColor: downColor,
    })
    candleSeriesRef.current = cs

    // Volume histogram (persistent)
    const vs = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    })
    volumeSeriesRef.current = vs

    chartRef.current = chart

    // ── Tooltip ──
    const tooltipEl = document.createElement('div')
    tooltipEl.className = 'chart-tooltip'
    tooltipEl.style.cssText = 'position:absolute;pointer-events:none;z-index:100;display:none'
    containerRef.current.appendChild(tooltipEl)

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!param.time || !param.point || !candleSeriesRef.current) {
        tooltipEl.style.display = 'none'
        return
      }

      const candleData = param.seriesData.get(candleSeriesRef.current) as CandlestickData | undefined
      if (!candleData) {
        tooltipEl.style.display = 'none'
        return
      }

      const ts = (candleData.time as number) * 1000
      const match = dataRef.current.find(c => c.timestamp === ts)
      if (!match) {
        tooltipEl.style.display = 'none'
        return
      }

      const change = match.close - match.open
      const changePct = match.open !== 0 ? (change / match.open) * 100 : 0
      const isUp = match.close >= match.open
      const date = new Date(match.timestamp)
      const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
      const isPositive = change >= 0

      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = param.point.x
      const y = param.point.y
      const tooltipX = x > rect.width * 0.7 ? x - 220 : x + 15
      const tooltipY = y < 60 ? y + 20 : y - 10

      tooltipEl.style.display = 'block'
      tooltipEl.style.left = tooltipX + 'px'
      tooltipEl.style.top = tooltipY + 'px'
      tooltipEl.innerHTML = `
        <div class="tooltip-header">${timeStr}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">O</span><span class="tooltip-val">$${match.open.toFixed(2)}</span>
          <span class="tooltip-label">H</span><span class="tooltip-val">$${match.high.toFixed(2)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">L</span><span class="tooltip-val">$${match.low.toFixed(2)}</span>
          <span class="tooltip-label">C</span><span class="tooltip-val">$${match.close.toFixed(2)}</span>
        </div>
        <div class="tooltip-row tooltip-change">
          <span class="tooltip-label">Chg</span>
          <span class="tooltip-val ${isPositive ? 'up' : 'down'}">${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePct.toFixed(2)}%)</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Vol</span><span class="tooltip-val">${match.volume.toLocaleString()}</span>
        </div>
      `
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.unsubscribeCrosshairMove(handleCrosshairMove)
      tooltipEl.remove()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      indicatorSeriesRef.current.clear()
    }
  }, []) // Only on mount

  // ── Update chart colors when theme changes ──
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: txt,
      },
    })
    if (candleSeriesRef.current) {
      candleSeriesRef.current.applyOptions({
        upColor,
        downColor,
        borderUpColor: upColor,
        borderDownColor: downColor,
        wickUpColor: upColor,
        wickDownColor: downColor,
      })
    }
  }, [bg, txt, upColor, downColor])

  // ── Update chart height when RSI or height changes ──
  useEffect(() => {
    if (!chartRef.current) return
    const mainHeight = showRSI ? Math.floor(height * 0.7) : height
    chartRef.current.applyOptions({ height: mainHeight })
    chartRef.current.priceScale('right').applyOptions({
      scaleMargins: { top: 0.05, bottom: showRSI ? 0.3 : 0.2 },
    })
    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: { top: showRSI ? 0.75 : 0.85, bottom: 0 },
    })
  }, [height, showRSI])

  // ── Update candle + volume data in-place ──
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return

    const chartData: CandlestickData[] = data.map(c => ({
      time: (c.timestamp / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    candleSeriesRef.current.setData(chartData)

    const volData: HistogramData[] = data.map(c => ({
      time: (c.timestamp / 1000) as Time,
      value: c.volume,
      color: c.close >= c.open ? upColor + '40' : downColor + '40',
    }))
    volumeSeriesRef.current.setData(volData)

    chartRef.current?.timeScale().fitContent()
  }, [data, upColor, downColor])

  // ── Helper: create or update line series ──
  const updateLineSeries = (id: string, lineData: LineData[], color: string, width: 1 | 2 = 1) => {
    if (!chartRef.current) return
    let series = indicatorSeriesRef.current.get(id)
    if (!series) {
      series = chartRef.current.addLineSeries({
        color,
        lineWidth: width,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      indicatorSeriesRef.current.set(id, series)
    }
    if (lineData.length > 0) {
      series.setData(lineData)
    }
  }

  // ── Update MA lines ──
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || data.length === 0) return

    const sma20Data: LineData[] = []
    const sma50Data: LineData[] = []

    if (showMA && indicators?.sma20) {
      indicators.sma20.forEach((val, i) => {
        if (val !== null && data[i]) {
          sma20Data.push({ time: (data[i].timestamp / 1000) as Time, value: val })
        }
      })
    }
    if (showMA && indicators?.sma50) {
      indicators.sma50.forEach((val, i) => {
        if (val !== null && data[i]) {
          sma50Data.push({ time: (data[i].timestamp / 1000) as Time, value: val })
        }
      })
    }

    if (sma20Data.length > 0) updateLineSeries('sma20', sma20Data, '#3b82f6', 1)
    else indicatorSeriesRef.current.get('sma20')?.setData([])

    if (sma50Data.length > 0) updateLineSeries('sma50', sma50Data, '#f59e0b', 1)
    else indicatorSeriesRef.current.get('sma50')?.setData([])
  }, [data, showMA, indicators?.sma20, indicators?.sma50])

  // ── Update Bollinger Bands ──
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || data.length === 0) return

    const upperData: LineData[] = []
    const middleData: LineData[] = []
    const lowerData: LineData[] = []

    if (showBB && indicators?.bollinger) {
      const bb = indicators.bollinger
      bb.upper?.forEach((val, i) => {
        if (val !== null && data[i]) upperData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      })
      bb.middle?.forEach((val, i) => {
        if (val !== null && data[i]) middleData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      })
      bb.lower?.forEach((val, i) => {
        if (val !== null && data[i]) lowerData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      })
    }

    if (upperData.length > 0) updateLineSeries('bbUpper', upperData, '#8b5cf660', 1)
    else indicatorSeriesRef.current.get('bbUpper')?.setData([])
    if (middleData.length > 0) updateLineSeries('bbMiddle', middleData, '#8b5cf6', 1)
    else indicatorSeriesRef.current.get('bbMiddle')?.setData([])
    if (lowerData.length > 0) updateLineSeries('bbLower', lowerData, '#8b5cf660', 1)
    else indicatorSeriesRef.current.get('bbLower')?.setData([])
  }, [data, showBB, indicators?.bollinger])

  return (
    <div className="chart-wrapper" style={{ position: 'relative' }}>
      <div ref={containerRef} className="chart-container" />
    </div>
  )
})

// ── MACD Panel ──

export const MACDPanel = memo(function MACDPanel({ data, macdLine, signal, histogram }: {
  data: Candle[]
  macdLine?: (number | null)[]
  signal?: (number | null)[]
  histogram?: (number | null)[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !macdLine || data.length === 0) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d111c' },
        textColor: '#7d879a',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1a2235', style: 2 },
        horzLines: { color: '#1a2235', style: 2 },
      },
      timeScale: { borderColor: '#1e2a3e', visible: false },
      rightPriceScale: { borderColor: '#1e2a3e', scaleMargins: { top: 0.15, bottom: 0.15 } },
      width: containerRef.current.clientWidth,
      height: 110,
      crosshair: {
        mode: 2,
        vertLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
        horzLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
      },
    })

    // Zero line
    const zeroLine = chart.addLineSeries({ color: '#3b4b6b80', lineWidth: 1, lastValueVisible: false, priceLineVisible: false })
    zeroLine.setData(data.map(c => ({ time: (c.timestamp / 1000) as Time, value: 0 })))

    // Histogram bars
    const histData: HistogramData[] = []
    histogram?.forEach((val, i) => {
      if (val !== null && data[i]) {
        histData.push({
          time: (data[i].timestamp / 1000) as Time,
          value: Math.abs(val),
          color: val >= 0 ? '#22c55e80' : '#ef444480',
        })
      }
    })
    if (histData.length > 0) {
      chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'hist',
      }).setData(histData)
      chart.priceScale('hist').applyOptions({
        scaleMargins: { top: 0.7, bottom: 0 },
      })
    }

    // MACD line
    const macdLineData: LineData[] = []
    macdLine.forEach((val, i) => {
      if (val !== null && data[i]) {
        macdLineData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      }
    })
    if (macdLineData.length > 0) {
      chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
      }).setData(macdLineData)
    }

    // Signal line
    const sigData: LineData[] = []
    signal?.forEach((val, i) => {
      if (val !== null && data[i]) {
        sigData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      }
    })
    if (sigData.length > 0) {
      chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 1,
        lastValueVisible: true,
        priceLineVisible: false,
      }).setData(sigData)
    }

    chart.timeScale().fitContent()
    chart.timeScale().scrollToPosition(0, false)

    return () => chart.remove()
  }, [data, macdLine, signal, histogram])

  return (
    <div className="macd-panel">
      <div className="macd-label">
        <span>MACD</span>
        <span style={{ color: '#3b82f6', marginLeft: 12 }}>● MACD</span>
        <span style={{ color: '#f59e0b', marginLeft: 8 }}>● Signal</span>
      </div>
      <div ref={containerRef} />
    </div>
  )
})

// ── RSI Panel ──

export const RSIPanel = memo(function RSIPanel({ data, rsi }: { data: Candle[]; rsi?: (number | null)[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !rsi || data.length === 0) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d111c' },
        textColor: '#7d879a',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1a2235', style: 2 },
        horzLines: { color: '#1a2235', style: 2 },
      },
      timeScale: { borderColor: '#1e2a3e', visible: false },
      rightPriceScale: { borderColor: '#1e2a3e', scaleMargins: { top: 0.1, bottom: 0.1 } },
      width: containerRef.current.clientWidth,
      height: 90,
      crosshair: {
        mode: 2,
        vertLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
        horzLine: { color: '#3b4b6b', width: 1, style: 3, labelBackgroundColor: '#1e2a3e' },
      },
    })

    // Overbought/oversold lines
    const line70 = chart.addLineSeries({ color: '#ef444460', lineWidth: 1, lastValueVisible: false, priceLineVisible: false })
    const line30 = chart.addLineSeries({ color: '#22c55e60', lineWidth: 1, lastValueVisible: false, priceLineVisible: false })
    line70.setData(data.map((c) => ({ time: (c.timestamp / 1000) as Time, value: 70 })))
    line30.setData(data.map((c) => ({ time: (c.timestamp / 1000) as Time, value: 30 })))

    const rsiData: LineData[] = []
    rsi.forEach((val, i) => {
      if (val !== null && data[i]) {
        rsiData.push({ time: (data[i].timestamp / 1000) as Time, value: val })
      }
    })

    if (rsiData.length > 0) {
      chart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
      }).setData(rsiData)
    }

    chart.timeScale().fitContent()
    chart.timeScale().scrollToPosition(0, false)

    return () => chart.remove()
  }, [data, rsi])

  return (
    <div className="rsi-panel">
      <div className="rsi-label">RSI (14)</div>
      <div ref={containerRef} />
    </div>
  )
})
