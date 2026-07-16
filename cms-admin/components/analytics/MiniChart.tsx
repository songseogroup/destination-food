'use client'

import { useMemo } from 'react'

export interface MiniChartPoint {
  date: string
  views: number
  clicks?: number
}

interface MiniChartProps {
  data: MiniChartPoint[]
  height?: number
  metric?: 'views' | 'clicks'
}

/** Brand gold — whisky-500. */
const GOLD = '#B8862F'
/** charcoal-200 hairline. */
const BASELINE = '#EDE7DF'

/**
 * Dependency-free area/line chart drawn as inline SVG.
 *
 * The viewBox uses a fixed 100-wide coordinate space and stretches to fill its
 * container (`preserveAspectRatio="none"`), while every stroke sets
 * `vector-effect="non-scaling-stroke"` so lines stay a crisp 2px regardless of
 * how wide the container gets. Height is 1:1 so the curve is never distorted
 * vertically. All-zero series render as a flat baseline (no divide-by-zero).
 */
export function MiniChart({ data, height = 72, metric = 'views' }: MiniChartProps) {
  const W = 100
  const H = height
  const label = metric === 'clicks' ? 'clicks' : 'views'

  const { linePath, areaPath, columns, hasData } = useMemo(() => {
    const values = data.map((d) => (metric === 'clicks' ? d.clicks ?? 0 : d.views))
    const n = values.length
    const max = Math.max(0, ...values)
    const padTop = 4
    const baseline = H - 1
    const usableH = Math.max(1, baseline - padTop)

    const xAt = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W)
    const yAt = (v: number) => (max <= 0 ? baseline : padTop + (1 - v / max) * usableH)

    if (n === 0) {
      return { linePath: '', areaPath: '', columns: [] as { x: number; w: number; date: string; v: number }[], hasData: false }
    }

    const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v), v, date: data[i].date }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    const last = pts[pts.length - 1]
    const area = `${line} L ${last.x.toFixed(2)},${baseline} L ${pts[0].x.toFixed(2)},${baseline} Z`

    // Full-height transparent columns give a native <title> tooltip per day.
    const colW = W / n
    const cols = pts.map((p, i) => ({
      x: (n <= 1 ? W / 2 : (i / (n - 1)) * W) - colW / 2,
      w: colW,
      date: p.date,
      v: p.v,
    }))

    return { linePath: line, areaPath: area, columns: cols, hasData: max > 0 }
  }, [data, metric, H])

  // Unique gradient id so multiple charts on one page don't collide.
  const gid = useMemo(() => 'mc-' + Math.random().toString(36).slice(2, 9), [])

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-charcoal-50 text-xs text-charcoal-400"
        style={{ height: H }}
      >
        No data yet
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={H}
      role="img"
      aria-label={`${label} over time`}
      className="block"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>

      <line
        x1="0"
        y1={H - 1}
        x2={W}
        y2={H - 1}
        stroke={BASELINE}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {hasData && <path d={areaPath} fill={`url(#${gid})`} stroke="none" />}

      <path
        d={linePath}
        fill="none"
        stroke={GOLD}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {columns.map((c, i) => (
        <rect key={i} x={c.x} y="0" width={c.w} height={H} fill="transparent">
          <title>{`${c.date}: ${c.v.toLocaleString()} ${label}`}</title>
        </rect>
      ))}
    </svg>
  )
}

export default MiniChart
