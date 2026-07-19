'use client'

/**
 * Hand-built SVG charts — zero charting library.
 *
 * Every visual here is inline SVG plus a handful of CSS keyframes, so it adds
 * nothing to the JS bundle and paints instantly. The animations are pure
 * transform / opacity / stroke-dashoffset, which the GPU handles, so it stays
 * silky even on a slow device. Impressive and feather-light, on purpose.
 */

const GOLD = '#B8862F'
const GOLD_LIGHT = '#E0B457'

const money = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0)

/** Catmull-Rom → cubic Bézier, for a smooth line through the points. */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

interface MonthPoint {
  label: string
  gross: number
  revenue: number
}

/**
 * Revenue trend — a glowing gold area chart that draws itself in.
 */
export function RevenueTrendChart({ data }: { data: MonthPoint[] }) {
  const W = 720
  const H = 260
  const padX = 24
  const padTop = 24
  const padBottom = 34
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom

  const max = Math.max(1, ...data.map((d) => d.gross))
  const xFor = (i: number) => padX + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const yFor = (v: number) => padTop + (1 - v / max) * innerH

  const grossPts = data.map((d, i) => ({ x: xFor(i), y: yFor(d.gross) }))
  const revPts = data.map((d, i) => ({ x: xFor(i), y: yFor(d.revenue) }))
  const grossLine = smoothPath(grossPts)
  const revLine = smoothPath(revPts)
  const areaPath = `${grossLine} L ${xFor(data.length - 1)},${padTop + innerH} L ${xFor(0)},${padTop + innerH} Z`

  const last = data[data.length - 1]
  const lastPt = grossPts[grossPts.length - 1]

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes dwDraw { to { stroke-dashoffset: 0; } }
        @keyframes dwArea { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dwPulse { 0%,100% { r: 5; opacity: 1; } 50% { r: 8; opacity: .55; } }
        @keyframes dwRise { from { opacity: 0; } to { opacity: 1; } }
        .dw-line { stroke-dasharray: 2600; stroke-dashoffset: 2600; animation: dwDraw 1.8s cubic-bezier(.4,0,.2,1) forwards; }
        .dw-line-2 { stroke-dasharray: 2600; stroke-dashoffset: 2600; animation: dwDraw 1.8s cubic-bezier(.4,0,.2,1) .25s forwards; }
        .dw-area { transform-origin: bottom; animation: dwArea 1.2s ease-out forwards; }
        .dw-dot-halo { animation: dwPulse 2.4s ease-in-out infinite; }
        .dw-lbl { opacity: 0; animation: dwRise .6s ease-out forwards; }
      `}</style>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Revenue trend, last 8 months">
        <defs>
          <linearGradient id="dwArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dwStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_LIGHT} />
          </linearGradient>
          <filter id="dwGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* faint gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={padX} x2={W - padX} y1={padTop + innerH * f} y2={padTop + innerH * f} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
        ))}

        {/* area + lines */}
        <path d={areaPath} fill="url(#dwArea)" className="dw-area" />
        <path d={revLine} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 4" className="dw-line-2" />
        <path d={grossLine} fill="none" stroke="url(#dwStroke)" strokeWidth="3.5" strokeLinecap="round" filter="url(#dwGlow)" className="dw-line" />

        {/* current-month glow dot */}
        {lastPt && (
          <>
            <circle cx={lastPt.x} cy={lastPt.y} r="5" fill={GOLD_LIGHT} className="dw-dot-halo" />
            <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="#fff" />
          </>
        )}

        {/* month labels */}
        {data.map((d, i) => (
          <text key={i} x={xFor(i)} y={H - 12} textAnchor="middle" fontSize="12" fill="#ffffff" fillOpacity="0.55" className="dw-lbl" style={{ animationDelay: `${0.6 + i * 0.05}s` }}>
            {d.label}
          </text>
        ))}
      </svg>

      {last && lastPt && (
        <div
          className="pointer-events-none absolute rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-lg"
          style={{ left: `${(lastPt.x / W) * 100}%`, top: `${(lastPt.y / H) * 100}%`, transform: 'translate(-50%, -140%)' }}
        >
          {money(last.gross)}
        </div>
      )}
    </div>
  )
}

interface Segment {
  label: string
  value: number
  color: string
}

/**
 * Animated donut — revenue share by listing type, arcs sweeping in.
 */
export function RevenueDonut({ segments, centerLabel, centerValue }: { segments: Segment[]; centerLabel: string; centerValue: string }) {
  const size = 200
  const r = 78
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  let offset = 0
  const arcs = segments.map((seg) => {
    const frac = seg.value / total
    const dash = frac * circ
    const arc = { ...seg, dash, gap: circ - dash, rotation: (offset / total) * 360 - 90 }
    offset += seg.value
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <style>{`
        @keyframes dwArc { from { stroke-dashoffset: var(--dw-circ); } to { stroke-dashoffset: 0; } }
        @keyframes dwFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Revenue by listing type">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00000010" strokeWidth="18" />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${a.dash} ${a.gap}`}
              transform={`rotate(${a.rotation} ${cx} ${cy})`}
              style={{
                // draw-in sweep
                ['--dw-circ' as any]: `${circ}`,
                strokeDashoffset: 0,
                animation: `dwArc 1.1s cubic-bezier(.4,0,.2,1) ${i * 0.18}s both`,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ animation: 'dwFade 1s ease-out .5s both' }}>
          <span className="text-xs uppercase tracking-wide text-gray-400">{centerLabel}</span>
          <span className="font-display text-2xl font-bold text-gray-900">{centerValue}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {segments.map((s) => {
          const pct = ((s.value / total) * 100).toFixed(0)
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-sm text-gray-700">{s.label}</span>
              <span className="text-sm font-semibold text-gray-900">{money(s.value)}</span>
              <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * "Where the money goes" — a single gross bar splitting into its parts, each
 * segment growing to width on mount.
 */
export function RevenueSplitFlow({
  gross,
  platformRevenue,
  operatorEarnings,
  refunds,
}: {
  gross: number
  platformRevenue: number
  operatorEarnings: number
  refunds: number
}) {
  const total = Math.max(1, platformRevenue + operatorEarnings + refunds)
  const parts = [
    { label: 'Platform revenue (DW)', value: platformRevenue, color: GOLD },
    { label: 'Paid to operators', value: operatorEarnings, color: '#3f6f52' },
    { label: 'Refunds', value: refunds, color: '#c05252' },
  ]

  return (
    <div>
      <style>{`@keyframes dwGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-gray-500">Every dollar booked</span>
        <span className="font-display text-lg font-bold text-gray-900">{money(gross)}</span>
      </div>
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100">
        {parts.map((p, i) => (
          <div
            key={p.label}
            className="h-full origin-left"
            style={{
              width: `${(p.value / total) * 100}%`,
              background: p.color,
              animation: `dwGrow .9s cubic-bezier(.4,0,.2,1) ${i * 0.15}s both`,
            }}
            title={`${p.label}: ${money(p.value)}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="text-xs text-gray-600">{p.label}</span>
            <span className="ml-auto text-xs font-semibold text-gray-900">{money(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
