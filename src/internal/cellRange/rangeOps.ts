/** Pure helpers for Excel-style cell ranges. Rows and columns are 0-based view indexes. */

export interface CellPos {
  r: number
  c: number
}

export interface CellRange {
  r0: number
  r1: number
  c0: number
  c1: number
}

/** One cell to write. `text` is always set (clipboard text, or the source text for fills). */
export interface CellWrite {
  r: number
  c: number
  text: string
  /** Raw value for fills: the source cell's value, or the next number of a series. */
  value?: unknown
  /** Source cell of a fill, so grids can copy raw values or shift formulas. */
  from?: CellPos
  /** True when `value` continues a numeric series rather than copying the source. */
  series?: boolean
}

export interface WriteResult {
  written: number
  failed: number
}

export const toRange = (a: CellPos, b: CellPos): CellRange => ({
  r0: Math.min(a.r, b.r),
  r1: Math.max(a.r, b.r),
  c0: Math.min(a.c, b.c),
  c1: Math.max(a.c, b.c),
})

export const rangeHeight = (range: CellRange) => range.r1 - range.r0 + 1
export const rangeWidth = (range: CellRange) => range.c1 - range.c0 + 1
export const rangeSize = (range: CellRange) => rangeHeight(range) * rangeWidth(range)

export const inRange = (range: CellRange | null, r: number, c: number) =>
  range !== null && r >= range.r0 && r <= range.r1 && c >= range.c0 && c <= range.c1

export const sameRange = (a: CellRange | null, b: CellRange | null) =>
  a === b || (a !== null && b !== null && a.r0 === b.r0 && a.r1 === b.r1 && a.c0 === b.c0 && a.c1 === b.c1)

/** Which outer edges of `range` the cell sits on: `"t r b l"` subset, or undefined. */
export function edgesOf(range: CellRange | null, r: number, c: number): string | undefined {
  if (!range || !inRange(range, r, c)) return undefined
  const edges = [r === range.r0 && 't', c === range.c1 && 'r', r === range.r1 && 'b', c === range.c0 && 'l'].filter(Boolean)
  return edges.length ? edges.join(' ') : undefined
}

const mod = (n: number, m: number) => ((n % m) + m) % m

/**
 * Where a clipboard block goes, the way Excel does it:
 * - one value and several selected cells: the value fills the selection;
 * - the selection is an exact multiple of the block: the block is tiled;
 * - otherwise the block is placed at the top-left of the selection (it may extend past it).
 */
export function pasteTargets(matrix: readonly (readonly string[])[], range: CellRange): CellWrite[] {
  const h = matrix.length
  const w = Math.max(0, ...matrix.map((row) => row.length))
  if (h === 0 || w === 0) return []
  const rh = rangeHeight(range)
  const rw = rangeWidth(range)
  const tile = (rh > h || rw > w) && rh % h === 0 && rw % w === 0
  const rows = tile ? rh : h
  const cols = tile ? rw : w
  const out: CellWrite[] = []
  for (let i = 0; i < rows; i++) {
    const line = matrix[i % h] ?? []
    for (let j = 0; j < cols; j++) {
      const text = line[j % w]
      if (text === undefined) continue
      out.push({ r: range.r0 + i, c: range.c0 + j, text })
    }
  }
  return out
}

/** Size of the block a paste writes (for selecting the pasted area afterwards). */
export function pastedRange(matrix: readonly (readonly string[])[], range: CellRange): CellRange {
  const h = matrix.length
  const w = Math.max(0, ...matrix.map((row) => row.length))
  const rh = rangeHeight(range)
  const rw = rangeWidth(range)
  const tile = (rh > h || rw > w) && rh % h === 0 && rw % w === 0
  return tile ? range : { r0: range.r0, c0: range.c0, r1: range.r0 + Math.max(h, 1) - 1, c1: range.c0 + Math.max(w, 1) - 1 }
}

const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v)
  return null
}

/** Step of an evenly spaced numeric line (`1, 2, 3` → 1), or null when it is not a series. */
function seriesStep(values: readonly unknown[]): number | null {
  if (values.length < 2) return null
  const nums = values.map(asNumber)
  if (nums.some((n) => n === null)) return null
  const list = nums as number[]
  const first = list[0] ?? 0
  const step = (list[1] ?? 0) - first
  const tolerance = 1e-9 * Math.max(1, Math.abs(step))
  return list.every((n, i) => Math.abs(n - (first + step * i)) <= tolerance) ? step : null
}

const roundSeries = (n: number) => Math.round(n * 1e10) / 1e10

/**
 * Cells written when the selection `source` is extended to `target` (fill handle, Ctrl+D,
 * Ctrl+R). Each line repeats the source pattern; a line of two or more evenly spaced numbers
 * continues as a series (`1, 2` → `3, 4, 5`), like Excel.
 */
export function fillTargets(
  source: CellRange,
  target: CellRange,
  getValue: (r: number, c: number) => unknown,
  getText: (r: number, c: number) => string
): CellWrite[] {
  const vertical = target.c0 === source.c0 && target.c1 === source.c1
  const out: CellWrite[] = []
  if (vertical) {
    const h = rangeHeight(source)
    for (let c = source.c0; c <= source.c1; c++) {
      const line = Array.from({ length: h }, (_, i) => getValue(source.r0 + i, c))
      const step = seriesStep(line)
      const first = asNumber(line[0])
      for (let r = target.r0; r <= target.r1; r++) {
        if (r >= source.r0 && r <= source.r1) continue
        const k = r - source.r0
        const from = { r: source.r0 + mod(k, h), c }
        if (step !== null && first !== null) {
          const value = roundSeries(first + step * k)
          out.push({ r, c, text: String(value), value, from, series: true })
        } else out.push({ r, c, text: getText(from.r, from.c), value: getValue(from.r, from.c), from })
      }
    }
    return out
  }
  const w = rangeWidth(source)
  for (let r = source.r0; r <= source.r1; r++) {
    const line = Array.from({ length: w }, (_, j) => getValue(r, source.c0 + j))
    const step = seriesStep(line)
    const first = asNumber(line[0])
    for (let c = target.c0; c <= target.c1; c++) {
      if (c >= source.c0 && c <= source.c1) continue
      const k = c - source.c0
      const from = { r, c: source.c0 + mod(k, w) }
      if (step !== null && first !== null) {
        const value = roundSeries(first + step * k)
        out.push({ r, c, text: String(value), value, from, series: true })
      } else out.push({ r, c, text: getText(from.r, from.c), value: getValue(from.r, from.c), from })
    }
  }
  return out
}

/** The range a fill-handle drag covers when the pointer is over `pos`; null inside the source. */
export function extendFill(source: CellRange, pos: CellPos): CellRange | null {
  const dr = pos.r > source.r1 ? pos.r - source.r1 : pos.r < source.r0 ? source.r0 - pos.r : 0
  const dc = pos.c > source.c1 ? pos.c - source.c1 : pos.c < source.c0 ? source.c0 - pos.c : 0
  if (dr === 0 && dc === 0) return null
  if (dr >= dc) return { ...source, r0: Math.min(source.r0, pos.r), r1: Math.max(source.r1, pos.r) }
  return { ...source, c0: Math.min(source.c0, pos.c), c1: Math.max(source.c1, pos.c) }
}

/**
 * Ctrl+D / Ctrl+R: with several rows (columns) selected, the first one fills the rest; with one,
 * the cell above (left) fills it. Null when there is nothing to fill from.
 */
export function fillShortcut(range: CellRange, direction: 'down' | 'right'): { source: CellRange; target: CellRange } | null {
  if (direction === 'down') {
    if (range.r1 > range.r0) return { source: { ...range, r1: range.r0 }, target: range }
    if (range.r0 === 0) return null
    return { source: { ...range, r0: range.r0 - 1, r1: range.r0 - 1 }, target: { ...range, r0: range.r0 - 1 } }
  }
  if (range.c1 > range.c0) return { source: { ...range, c1: range.c0 }, target: range }
  if (range.c0 === 0) return null
  return { source: { ...range, c0: range.c0 - 1, c1: range.c0 - 1 }, target: { ...range, c0: range.c0 - 1 } }
}

export interface RangeSummary {
  /** Non-empty cells. */
  count: number
  /** Cells holding a number. */
  numericCount: number
  sum: number
  average: number | null
  min: number | null
  max: number | null
}

/** Excel status-bar numbers for the selected values. Numeric strings (`"12.50"`) count as numbers. */
export function summarize(values: Iterable<unknown>): RangeSummary {
  let count = 0
  let numericCount = 0
  let sum = 0
  let min: number | null = null
  let max: number | null = null
  for (const v of values) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue
    count += 1
    const n = typeof v === 'boolean' ? null : asNumber(v)
    if (n === null) continue
    numericCount += 1
    sum += n
    min = min === null ? n : Math.min(min, n)
    max = max === null ? n : Math.max(max, n)
  }
  return { count, numericCount, sum: roundSeries(sum), average: numericCount ? roundSeries(sum / numericCount) : null, min, max }
}
