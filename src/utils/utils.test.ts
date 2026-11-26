import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  datePlaceholder,
  formatDate,
  getDateOrder,
  isoToZoned,
  monthGrid,
  parseDateText,
  parseTimeText,
  zonedToISO,
} from './date'
import { addDecimal, compareDecimal, formatDecimal, multiplyDecimal, roundDecimal, sumDecimals } from './decimal'
import { formatNumber, normalizeDecimalText, parseNumber, roundTo } from './number'

describe('number parsing', () => {
  it.each([
    ['1234.5', 'en-US', 1234.5],
    ['1,234.50', 'en-US', 1234.5],
    ['1.234,50', 'de-DE', 1234.5],
    ['1234.5', 'de-DE', 1234.5],
    ['1.234', 'de-DE', 1234],
    ['(12)', 'en-US', -12],
    ['-12', 'en-US', -12],
    ['.5', 'en-US', 0.5],
    ['1 234,5', 'fr-FR', 1234.5],
  ])('parses %s in %s', (text, locale, expected) => {
    expect(parseNumber(text, locale)).toEqual({ ok: true, value: expected })
  })

  it('treats empty text as null', () => {
    expect(parseNumber('  ', 'en-US')).toEqual({ ok: true, value: null })
  })

  it.each(['12abc', '1,2,3', '--1', 'abc', '1.2.3'])('rejects %s', (text) => {
    expect(parseNumber(text, 'en-US').ok).toBe(false)
  })

  it('normalizes without float conversion', () => {
    expect(normalizeDecimalText('12345678901234567.89', 'en-US')).toEqual({ ok: true, value: '12345678901234567.89' })
  })

  it('formats and rounds', () => {
    expect(formatNumber(1234.5, 'en-US', { minimumFractionDigits: 2 })).toBe('1,234.50')
    expect(formatNumber(1234.5, 'de-DE', { minimumFractionDigits: 2 })).toBe('1.234,50')
    expect(roundTo(1.005, 2)).toBe(1.01)
  })
})

describe('decimal math', () => {
  it('adds and multiplies exactly', () => {
    expect(addDecimal('0.1', '0.2')).toBe('0.3')
    expect(multiplyDecimal('19.99', '3')).toBe('59.97')
    expect(sumDecimals(['10.10', '20.20', null, '0.005'])).toBe('30.305')
  })

  it('rounds half away from zero', () => {
    expect(roundDecimal('2.345', 2)).toBe('2.35')
    expect(roundDecimal('-2.345', 2)).toBe('-2.35')
    expect(roundDecimal('2', 2)).toBe('2.00')
  })

  it('compares and formats', () => {
    expect(compareDecimal('10.5', '10.50')).toBe(0)
    expect(compareDecimal('-1', '0')).toBe(-1)
    expect(formatDecimal('1234.5', 'en-US', { currency: 'USD' })).toBe('$1,234.50')
  })
})

describe('dates', () => {
  it('does month math with clamping', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('parses locale and ISO text', () => {
    expect(parseDateText('03/15/2026', 'en-US')).toEqual({ ok: true, value: '2026-03-15' })
    expect(parseDateText('15.03.2026', 'de-DE')).toEqual({ ok: true, value: '2026-03-15' })
    expect(parseDateText('2026-03-15', 'de-DE')).toEqual({ ok: true, value: '2026-03-15' })
    expect(parseDateText('2/30/2026', 'en-US').ok).toBe(false)
    expect(parseDateText('46096', 'en-US', { allowSerial: true })).toEqual({ ok: true, value: '2026-03-15' })
  })

  it('knows locale order and placeholder', () => {
    expect(getDateOrder('en-US')).toEqual(['month', 'day', 'year'])
    expect(datePlaceholder('de-DE')).toBe('DD.MM.YYYY')
    expect(formatDate('2026-03-15', 'en-US')).toBe('03/15/2026')
  })

  it('builds a 6-week month grid', () => {
    const grid = monthGrid('2026-03-15', 1)
    expect(grid).toHaveLength(6)
    expect(grid[0]?.[0]).toBe('2026-02-23')
  })

  it('parses times', () => {
    expect(parseTimeText('2:30 pm')).toEqual({ ok: true, value: '14:30' })
    expect(parseTimeText('0930')).toEqual({ ok: true, value: '09:30' })
    expect(parseTimeText('25:00').ok).toBe(false)
  })

  it('converts wall time in a zone to an ISO instant and back', () => {
    const iso = zonedToISO('2026-03-15', '09:30', 'Asia/Jakarta')
    expect(iso).toBe('2026-03-15T09:30:00+07:00')
    expect(isoToZoned(iso, 'UTC')).toEqual({ date: '2026-03-15', time: '02:30' })
  })
})
