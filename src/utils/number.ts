/** Result of parsing user text. `ok: false` means the text is not a valid value. */
export type ParseResult<T> = { ok: true; value: T | null } | { ok: false }

export interface NumberSeparators {
  decimal: string
  group: string
}

const separatorCache = new Map<string, NumberSeparators>()

/** Decimal and group separators for a locale (`.`/`,` in en-US, `,`/`.` in de-DE). */
export function getSeparators(locale: string): NumberSeparators {
  const cached = separatorCache.get(locale)
  if (cached) return cached
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const result = {
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
  }
  separatorCache.set(locale, result)
  return result
}

/** Whitespace, no-break spaces and the Swiss apostrophe are always group separators. */
const SPACE_GROUPS = /[\s\u00a0\u202f'\u2019]/g

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Converts locale-formatted text to a canonical decimal string (`-1234.5`) without going
 * through a float. Accepts `1234.5`, `1,234.50`, `1.234,50` (by locale), `(12)` and `-12`.
 * Returns `{ ok: true, value: null }` for empty text.
 */
export function normalizeDecimalText(text: string, locale: string): ParseResult<string> {
  let s = text.trim()
  if (s === '') return { ok: true, value: null }

  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  if (/^[-\u2212]/.test(s)) {
    if (negative) return { ok: false }
    negative = true
    s = s.slice(1).trim()
  } else if (s.startsWith('+')) {
    s = s.slice(1).trim()
  }

  s = s.replace(SPACE_GROUPS, '')
  const seps = getSeparators(locale)

  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  let decimalSep: string | null = null
  let groupSep: string | null = null

  if (hasDot && hasComma) {
    // Both present: the last one is the decimal separator.
    decimalSep = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ','
    groupSep = decimalSep === '.' ? ',' : '.'
  } else if (hasDot || hasComma) {
    const sep = hasDot ? '.' : ','
    const count = s.split(sep).length - 1
    const groupPattern = new RegExp(`^\\d{1,3}(${escapeRegExp(sep)}\\d{3})+$`)
    if (sep === seps.decimal) {
      decimalSep = sep
    } else if (groupPattern.test(s)) {
      groupSep = sep
    } else if (count === 1) {
      // Not this locale's decimal separator, but unambiguous (e.g. `1234.5` pasted from Excel).
      decimalSep = sep
    } else {
      return { ok: false }
    }
  }

  if (groupSep) {
    const [intPart = '', ...rest] = decimalSep ? s.split(decimalSep) : [s]
    if (rest.length > 1) return { ok: false }
    if (!new RegExp(`^\\d{1,3}(${escapeRegExp(groupSep)}\\d{3})*$`).test(intPart)) return { ok: false }
    s = intPart.split(groupSep).join('') + (rest.length ? `.${rest[0] ?? ''}` : '')
  } else if (decimalSep && decimalSep !== '.') {
    s = s.replace(decimalSep, '.')
  }

  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return { ok: false }
  if (s.startsWith('.')) s = `0${s}`
  if (s.endsWith('.')) s = s.slice(0, -1)
  s = s.replace(/^0+(?=\d)/, '')
  if (negative && !/^0(\.0*)?$/.test(s)) s = `-${s}`
  return { ok: true, value: s }
}

/** Parses locale-formatted text to a number. */
export function parseNumber(text: string, locale: string): ParseResult<number> {
  const result = normalizeDecimalText(text, locale)
  if (!result.ok) return result
  return { ok: true, value: result.value === null ? null : Number(result.value) }
}

export interface FormatNumberOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

/** Formats a number for display (`1,234.50`). */
export function formatNumber(value: number, locale: string, options: FormatNumberOptions = {}): string {
  const min = options.minimumFractionDigits ?? 0
  const max = Math.min(Math.max(options.maximumFractionDigits ?? 20, min), 20)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: options.useGrouping ?? true,
  }).format(value)
}

/** Plain text for editing: no grouping, locale decimal separator (`1234,5` in de-DE). */
export function formatNumberForEdit(value: number, locale: string): string {
  return String(value).replace('.', getSeparators(locale).decimal)
}

/** Rounds to a number of decimals without binary drift for typical inputs. */
export function roundTo(value: number, precision: number): number {
  return Number(`${String(Math.round(Number(`${String(value)}e${String(precision)}`)))}e-${String(precision)}`)
}

/** Clamps a number to an optional range. */
export function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}
