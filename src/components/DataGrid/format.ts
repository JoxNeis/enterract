import { formatDate } from '../../utils/date'
import { compareDecimal, formatDecimal, isDecimal, sumDecimals } from '../../utils/decimal'
import { formatNumber } from '../../utils/number'
import type { Key, Option } from '../../utils/types'
import { toText } from '../../utils/text'
import type { GridColumn, GridRow } from './types'

/** Stable key of a column. */
export function columnKey<TData, TMeta>(column: GridColumn<TData, TMeta>): string {
  return column.id ?? column.field
}

/** The value a column shows for a row: computed `value(row)` or `row.data[field]`. */
export function cellValue<TData, TMeta>(column: GridColumn<TData, TMeta>, row: GridRow<TData, TMeta>): unknown {
  return column.value ? column.value(row) : row.data[column.field]
}

export function columnLabel<TData, TMeta>(column: GridColumn<TData, TMeta>): string {
  return column.label ?? (typeof column.header === 'string' ? column.header : column.field)
}

export function columnOptions<TData, TMeta>(
  column: GridColumn<TData, TMeta>,
  row: GridRow<TData, TMeta>
): readonly Option<Key>[] {
  return typeof column.options === 'function' ? column.options(row) : (column.options ?? [])
}

function optionLabel(options: readonly Option<Key>[], key: unknown): string {
  const found = options.find((o) => o.key === key)
  return found ? found.label : key == null ? '' : toText(key)
}

/** Text shown in a cell (and copied with `copyAs: 'display'`). */
export function displayText<TData, TMeta>(
  column: GridColumn<TData, TMeta>,
  row: GridRow<TData, TMeta>,
  value: unknown,
  locale: string,
  currency: string
): string {
  if (column.format) return column.format(value, row)
  if (value === null || value === undefined || value === '') return ''
  switch (column.editor) {
    case 'number':
      return typeof value === 'number'
        ? formatNumber(value, locale, { maximumFractionDigits: column.precision, minimumFractionDigits: column.precision })
        : toText(value)
    case 'currency':
      return typeof value === 'string' && isDecimal(value)
        ? formatDecimal(value, locale, { currency: column.currency ?? currency })
        : toText(value)
    case 'date':
      return formatDate(toText(value), locale)
    case 'checkbox':
      return value === true ? 'Yes' : 'No'
    case 'select':
      return optionLabel(columnOptions(column, row), value)
    case 'multiselect': {
      const options = columnOptions(column, row)
      return Array.isArray(value) ? value.map((k) => optionLabel(options, k)).join(', ') : ''
    }
    case 'lookup':
      return column.lookup?.peekLabel?.(value as Key) ?? toText(value)
    default:
      return typeof value === 'object' ? JSON.stringify(value) : toText(value)
  }
}

/** Clipboard text for one cell, written so Excel recognises the type. */
export function copyText<TData, TMeta>(
  column: GridColumn<TData, TMeta>,
  row: GridRow<TData, TMeta>,
  value: unknown,
  locale: string,
  currency: string
): string {
  const byDefault =
    column.editor === 'select' || column.editor === 'multiselect' || column.editor === 'lookup' ? 'display' : 'value'
  const mode = column.copyAs ?? (column.format && !column.editor ? 'display' : byDefault)
  if (mode === 'display') return displayText(column, row, value, locale, currency)
  if (value === null || value === undefined) return ''
  if (column.editor === 'checkbox' || typeof value === 'boolean') return value === true ? 'TRUE' : 'FALSE'
  if (Array.isArray(value)) return value.map(toText).join(';')
  if (typeof value === 'number') return toText(value)
  return typeof value === 'object' ? JSON.stringify(value) : toText(value)
}

/** Sort comparator for two cell values of a column. */
export function compareCells<TData, TMeta>(column: GridColumn<TData, TMeta>, a: unknown, b: unknown, locale: string) {
  const empty = (v: unknown) => v === null || v === undefined || v === ''
  if (empty(a) && empty(b)) return 0
  if (empty(a)) return 1
  if (empty(b)) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  if (column.editor === 'currency' && typeof a === 'string' && typeof b === 'string' && isDecimal(a) && isDecimal(b))
    return compareDecimal(a, b)
  return toText(a).localeCompare(toText(b), locale, { numeric: true, sensitivity: 'base' })
}

/** Footer total / group subtotal for a column. */
export function aggregate<TData, TMeta>(
  column: GridColumn<TData, TMeta>,
  rows: GridRow<TData, TMeta>[],
  locale: string,
  currency: string
) {
  const kind = column.aggregate
  if (!kind) return null
  if (typeof kind === 'function') return kind(rows)
  const values = rows.map((r) => cellValue(column, r)).filter((v) => v !== null && v !== undefined && v !== '')
  if (kind === 'count') return String(values.length)
  if (values.length === 0) return ''
  if (column.editor === 'currency') {
    const decimals = values.filter((v): v is string => typeof v === 'string' && isDecimal(v))
    const first = rows[0]
    if (kind === 'sum' && first) return displayText(column, first, sumDecimals(decimals), locale, currency)
  }
  const numbers = values.filter((v): v is number => typeof v === 'number')
  if (numbers.length === 0) return ''
  const result =
    kind === 'sum'
      ? numbers.reduce((s, n) => s + n, 0)
      : kind === 'avg'
        ? numbers.reduce((s, n) => s + n, 0) / numbers.length
        : kind === 'min'
          ? Math.min(...numbers)
          : Math.max(...numbers)
  return formatNumber(result, locale, {
    maximumFractionDigits: column.precision ?? 2,
    minimumFractionDigits: column.precision,
  })
}
