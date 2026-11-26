import { parseDateText } from '../../utils/date'
import { normalizeDecimalText, parseNumber, type ParseResult } from '../../utils/number'
import type { Key } from '../../utils/types'
import { columnOptions } from './format'
import type { GridColumn, GridRow } from './types'

export { parseTsv, quoteTsvCell, toHtmlTable, toTsv } from '../../utils/tsv'

const TRUE_WORDS = new Set(['true', '1', 'yes', 'y', 'x', 'ja', 'ya', 'oui', 'si', 'wahr'])
const FALSE_WORDS = new Set(['false', '0', 'no', 'n', '', 'nein', 'tidak', 'non', 'falsch'])

/** `TRUE/FALSE`, `1/0`, `yes/no`, `y/n`, `x`/empty (case-insensitive). */
export function parseBoolean(text: string): ParseResult<boolean> {
  const s = text.trim().toLowerCase()
  if (TRUE_WORDS.has(s)) return { ok: true, value: true }
  if (FALSE_WORDS.has(s)) return { ok: true, value: false }
  return { ok: false }
}

/** Strips a leading/trailing currency symbol or code (`$1,234.50`, `1.234,50 €`, `USD 12`). */
function stripCurrency(text: string): string {
  return text.trim().replace(/^[^\d\-+(.,]+/, '').replace(/[^\d)]+$/, (m) => (/[.,]/.test(m[0] ?? '') ? m : ''))
}

/** Default paste parser for a column, by editor type. */
export function parsePastedValue<TData, TMeta>(
  column: GridColumn<TData, TMeta>,
  row: GridRow<TData, TMeta>,
  text: string,
  locale: string
): ParseResult<unknown> {
  if (column.parse) return column.parse(text, row)
  const trimmed = text.trim()
  switch (column.editor) {
    case 'number':
      return parseNumber(trimmed, locale)
    case 'currency':
      return normalizeDecimalText(stripCurrency(trimmed), locale)
    case 'date':
      return parseDateText(trimmed, locale, { allowSerial: true })
    case 'checkbox':
      return parseBoolean(trimmed)
    case 'select': {
      if (trimmed === '') return { ok: true, value: null }
      const match = matchOption(columnOptions(column, row), trimmed)
      return match === undefined ? { ok: false } : { ok: true, value: match }
    }
    case 'multiselect': {
      if (trimmed === '') return { ok: true, value: [] }
      const options = columnOptions(column, row)
      const keys = trimmed.split(/[;,]/).map((part) => matchOption(options, part.trim()))
      return keys.some((k) => k === undefined) ? { ok: false } : { ok: true, value: keys }
    }
    case 'lookup': {
      if (trimmed === '') return { ok: true, value: null }
      const key = column.lookup?.resolveText?.(trimmed)
      return key === null || key === undefined ? { ok: false } : { ok: true, value: key }
    }
    default:
      return { ok: true, value: text === '' ? null : text }
  }
}

function matchOption(options: readonly { key: Key; label: string }[], text: string): Key | undefined {
  const q = text.toLowerCase()
  return (
    options.find((o) => String(o.key).toLowerCase() === q)?.key ?? options.find((o) => o.label.toLowerCase() === q)?.key
  )
}
