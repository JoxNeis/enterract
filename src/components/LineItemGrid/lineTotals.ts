import { addDecimal, isDecimal, multiplyDecimal, roundDecimal, subtractDecimal, sumDecimals } from '../../utils/decimal'

export interface LineAmountInput {
  quantity: number | null | undefined
  /** Unit price as a decimal string. */
  price: string | null | undefined
  /** Discount in percent (10 = 10%). */
  discountPercent?: number | null
  taxable?: boolean | null
}

export interface LineTotals {
  /** Sum of quantity × price before discounts. */
  gross: string
  discount: string
  /** Sum of line amounts after discount. */
  subtotal: string
  tax: string
  total: string
}

const toDecimal = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(10).replace(/0+$/, '').replace(/\.$/, ''))

/** Gross amount (quantity × price) without rounding, or null when either is missing. */
export function lineGross({ quantity, price }: LineAmountInput): string | null {
  if (quantity === null || quantity === undefined || !price || !isDecimal(price)) return null
  return multiplyDecimal(toDecimal(quantity), price)
}

/** Line amount after discount, rounded to `scale` decimals. Exact decimal math, no floats. */
export function lineAmount(line: LineAmountInput, scale = 2): string | null {
  const gross = lineGross(line)
  if (gross === null) return null
  const pct = line.discountPercent ?? 0
  const discount = pct ? multiplyDecimal(gross, multiplyDecimal(toDecimal(pct), '0.01')) : '0'
  return roundDecimal(subtractDecimal(gross, discount), scale)
}

/** Document totals. Tax is `taxRate` (decimal fraction, e.g. `"0.11"`) on taxable lines, rounded once. */
export function computeTotals(lines: readonly LineAmountInput[], taxRate = '0', scale = 2): LineTotals {
  const gross = sumDecimals(lines.map((l) => lineGross(l)))
  const amounts = lines.map((l) => lineAmount(l, scale))
  const subtotal = sumDecimals(amounts)
  const taxableBase = sumDecimals(lines.map((l, i) => (l.taxable === false ? null : amounts[i])))
  const tax = roundDecimal(multiplyDecimal(taxableBase, taxRate), scale)
  return {
    gross: roundDecimal(gross, scale),
    discount: roundDecimal(subtractDecimal(gross, subtotal), scale),
    subtotal: roundDecimal(subtotal, scale),
    tax,
    total: roundDecimal(addDecimal(subtotal, tax), scale),
  }
}
