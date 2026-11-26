/** "Nice" axis ticks covering [min, max] (always including 0). */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  if (lo === hi) return [0, 1]
  const raw = (hi - lo) / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)))
  return ticks
}

/** Linear scale from a domain to a range. */
export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (v: number) => r0 + (v - d0) * k
}

/** SVG path for a bar with 4px rounded corners on the end away from the baseline. */
export function barPath(x: number, y0: number, y1: number, width: number, radius = 4): string {
  const h = Math.abs(y1 - y0)
  const r = Math.min(radius, width / 2, h)
  const up = y1 < y0
  if (h === 0) return ''
  if (up) {
    return `M${String(x)},${String(y0)}V${String(y1 + r)}Q${String(x)},${String(y1)} ${String(x + r)},${String(y1)}H${String(x + width - r)}Q${String(x + width)},${String(y1)} ${String(x + width)},${String(y1 + r)}V${String(y0)}Z`
  }
  return `M${String(x)},${String(y0)}V${String(y1 - r)}Q${String(x)},${String(y1)} ${String(x + r)},${String(y1)}H${String(x + width - r)}Q${String(x + width)},${String(y1)} ${String(x + width)},${String(y1 - r)}V${String(y0)}Z`
}

/** SVG arc path for a pie/donut slice (angles in radians, 0 = 12 o'clock). */
export function arcPath(cx: number, cy: number, r: number, inner: number, a0: number, a1: number): string {
  const pt = (radius: number, a: number) => [cx + radius * Math.sin(a), cy - radius * Math.cos(a)] as const
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x0, y0] = pt(r, a0)
  const [x1, y1] = pt(r, a1)
  if (inner <= 0) {
    return `M${String(cx)},${String(cy)}L${String(x0)},${String(y0)}A${String(r)},${String(r)} 0 ${String(large)} 1 ${String(x1)},${String(y1)}Z`
  }
  const [x2, y2] = pt(inner, a1)
  const [x3, y3] = pt(inner, a0)
  return `M${String(x0)},${String(y0)}A${String(r)},${String(r)} 0 ${String(large)} 1 ${String(x1)},${String(y1)}L${String(x2)},${String(y2)}A${String(inner)},${String(inner)} 0 ${String(large)} 0 ${String(x3)},${String(y3)}Z`
}

/** CSS variable of a categorical slot (1-based, max 8). */
export const seriesColor = (index: number) => `var(--erp-chart-${String((index % 8) + 1)})`
