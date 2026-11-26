import { toText } from '../../utils/text'

export type PivotAggregate = 'sum' | 'count' | 'avg' | 'min' | 'max'

export interface PivotValue {
  field: string
  aggregate: PivotAggregate
  /** Header text. Defaults to "Sum of Amount". */
  label?: string
}

export interface PivotConfig {
  /** Fields grouped down the side, outermost first. */
  rows: string[]
  /** Fields spread across the top. */
  columns: string[]
  /** Measures. */
  values: PivotValue[]
}

export type PivotRecord = Record<string, unknown>

export interface PivotCell {
  /** One number per value definition. */
  values: (number | null)[]
}

export interface PivotResult {
  /** Row key paths, sorted (`['Jakarta', 'Bolts']`). Includes subtotal paths of length < rows.length. */
  rowKeys: string[][]
  colKeys: string[][]
  /** `cell(rowPath, colPath)`; empty path = total. */
  cell: (rowPath: readonly string[], colPath: readonly string[]) => PivotCell
}

const SEP = '\u0001'

interface Acc {
  sum: number
  count: number
  min: number
  max: number
}

const label = (v: unknown) => (v === null || v === undefined || v === '' ? '(blank)' : toText(v))

export function aggregateLabel(v: PivotValue, fieldLabel = v.field): string {
  if (v.label) return v.label
  const name = { sum: 'Sum', count: 'Count', avg: 'Average', min: 'Min', max: 'Max' }[v.aggregate]
  return `${name} of ${fieldLabel}`
}

function finish(acc: Acc | undefined, aggregate: PivotAggregate): number | null {
  if (!acc) return aggregate === 'count' ? 0 : null
  switch (aggregate) {
    case 'sum':
      return acc.sum
    case 'count':
      return acc.count
    case 'avg':
      return acc.count ? acc.sum / acc.count : null
    case 'min':
      return acc.count ? acc.min : null
    case 'max':
      return acc.count ? acc.max : null
  }
}

/** Aggregates records into a pivot: every row/column path prefix gets a subtotal. */
export function pivot(records: readonly PivotRecord[], config: PivotConfig, collator = new Intl.Collator(undefined, { numeric: true })): PivotResult {
  const accs = new Map<string, Acc[]>()
  const rowSet = new Map<string, string[]>()
  const colSet = new Map<string, string[]>()

  for (const r of records) {
    const rowPath = config.rows.map((f) => label(r[f]))
    const colPath = config.columns.map((f) => label(r[f]))
    for (let i = 0; i <= rowPath.length; i++) {
      const rp = rowPath.slice(0, i)
      if (i > 0) rowSet.set(rp.join(SEP), rp)
      for (let j = 0; j <= colPath.length; j++) {
        const cp = colPath.slice(0, j)
        if (j === colPath.length && j > 0) colSet.set(cp.join(SEP), cp)
        const key = `${rp.join(SEP)}|${cp.join(SEP)}`
        let list = accs.get(key)
        if (!list) {
          list = config.values.map(() => ({ sum: 0, count: 0, min: Infinity, max: -Infinity }))
          accs.set(key, list)
        }
        config.values.forEach((v, k) => {
          const acc = list[k]
          if (!acc) return
          const raw = r[v.field]
          if (v.aggregate === 'count') {
            if (raw !== null && raw !== undefined && raw !== '') acc.count += 1
            return
          }
          const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw !== '' ? Number(raw) : NaN
          if (Number.isNaN(n)) return
          acc.sum += n
          acc.count += 1
          acc.min = Math.min(acc.min, n)
          acc.max = Math.max(acc.max, n)
        })
      }
    }
  }

  const sortPaths = (paths: string[][]) =>
    paths.sort((a, b) => {
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] === undefined) return -1
        if (b[i] === undefined) return 1
        const c = collator.compare(a[i] ?? '', b[i] ?? '')
        if (c !== 0) return c
      }
      return 0
    })

  return {
    rowKeys: sortPaths([...rowSet.values()]),
    colKeys: sortPaths([...colSet.values()]),
    cell: (rowPath, colPath) => {
      const list = accs.get(`${rowPath.join(SEP)}|${colPath.join(SEP)}`)
      return { values: config.values.map((v, k) => finish(list?.[k], v.aggregate)) }
    },
  }
}
