import { normalizeDecimalText, type ParseResult } from './number'

/**
 * Exact decimal arithmetic on strings (`"1234.50"`), for money. Never converts to a float.
 * Values are canonical decimal strings: optional `-`, digits, optional `.digits`.
 */
interface Scaled {
  n: bigint
  scale: number
}

function toScaled(value: string): Scaled {
  const negative = value.startsWith('-')
  const [int = '0', frac = ''] = (negative ? value.slice(1) : value).split('.')
  const n = BigInt(int + frac)
  return { n: negative ? -n : n, scale: frac.length }
}

function fromScaled({ n, scale }: Scaled): string {
  const negative = n < 0n
  const digits = (negative ? -n : n).toString().padStart(scale + 1, '0')
  const int = digits.slice(0, digits.length - scale)
  const frac = scale > 0 ? digits.slice(digits.length - scale) : ''
  const body = frac ? `${int}.${frac}` : int
  return negative && /[1-9]/.test(body) ? `-${body}` : body
}

function align(a: Scaled, b: Scaled): [bigint, bigint, number] {
  const scale = Math.max(a.scale, b.scale)
  return [a.n * 10n ** BigInt(scale - a.scale), b.n * 10n ** BigInt(scale - b.scale), scale]
}

/** True for a canonical decimal string. */
export function isDecimal(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value)
}

/** Parses locale text (`1.234,50` in de-DE) to a decimal string. */
export function parseDecimal(text: string, locale: string): ParseResult<string> {
  return normalizeDecimalText(text, locale)
}

export function addDecimal(a: string, b: string): string {
  const [x, y, scale] = align(toScaled(a), toScaled(b))
  return fromScaled({ n: x + y, scale })
}

export function subtractDecimal(a: string, b: string): string {
  const [x, y, scale] = align(toScaled(a), toScaled(b))
  return fromScaled({ n: x - y, scale })
}

export function multiplyDecimal(a: string, b: string): string {
  const x = toScaled(a)
  const y = toScaled(b)
  return fromScaled({ n: x.n * y.n, scale: x.scale + y.scale })
}

/** Sum of decimal strings. Empty list = "0". */
export function sumDecimals(values: readonly (string | null | undefined)[]): string {
  return values.reduce<string>((acc, v) => (v ? addDecimal(acc, v) : acc), '0')
}

/** Rounds half away from zero to `scale` decimals and pads to exactly `scale` digits. */
export function roundDecimal(value: string, scale: number): string {
  const s = toScaled(value)
  if (s.scale <= scale) {
    return fromScaled({ n: s.n * 10n ** BigInt(scale - s.scale), scale })
  }
  const factor = 10n ** BigInt(s.scale - scale)
  const negative = s.n < 0n
  const abs = negative ? -s.n : s.n
  let q = abs / factor
  if ((abs % factor) * 2n >= factor) q += 1n
  return fromScaled({ n: negative ? -q : q, scale })
}

/** -1, 0 or 1. */
export function compareDecimal(a: string, b: string): number {
  const [x, y] = align(toScaled(a), toScaled(b))
  return x === y ? 0 : x < y ? -1 : 1
}

export interface FormatDecimalOptions {
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  currencyDisplay?: 'symbol' | 'code' | 'narrowSymbol' | 'name'
  useGrouping?: boolean
}

/** Formats a decimal string exactly (Intl.NumberFormat accepts decimal strings without rounding to float). */
export function formatDecimal(value: string, locale: string, options: FormatDecimalOptions = {}): string {
  const { currency, currencyDisplay = 'symbol', useGrouping = true } = options
  const nf = new Intl.NumberFormat(locale, {
    style: currency ? 'currency' : 'decimal',
    currency,
    currencyDisplay,
    useGrouping,
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  })
  return nf.format(value as `${number}`)
}

/** Number of minor-unit digits for a currency (2 for USD, 0 for JPY). */
export function currencyDigits(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}
