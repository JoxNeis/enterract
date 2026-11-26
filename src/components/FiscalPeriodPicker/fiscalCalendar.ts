import { addDays, addMonths, endOfMonth, monthNames } from '../../utils/date'

export interface FiscalPeriod {
  /** Stable key, e.g. `FY2026-P01`. This is the picker's value. */
  key: string
  /** e.g. `P01 · Apr 2025`. */
  label: string
  /** First day, ISO. */
  from: string
  /** Last day, ISO. */
  to: string
  /** Closed for posting. */
  closed?: boolean
}

export interface FiscalYear {
  key: string
  label: string
  periods: FiscalPeriod[]
}

/** Your fiscal calendar. Load it from configuration; it is not derived from the Gregorian calendar. */
export interface FiscalCalendar {
  years: FiscalYear[]
}

export interface BuildFiscalCalendarOptions {
  /** Month the fiscal year starts in, 1–12 (4 = April). */
  startMonth: number
  /** First fiscal year to generate (named by the calendar year it ends in, unless `nameBy: 'start'`). */
  firstYear: number
  /** Number of years. */
  count: number
  /** Name FY by the year it starts or ends in. */
  nameBy?: 'start' | 'end'
  /** Add a 13th adjustment period (one day, last day of the year). */
  adjustmentPeriod?: boolean
  /** Periods ending before this ISO date are marked closed. */
  closedBefore?: string
  locale?: string
}

/** Builds a monthly fiscal calendar, e.g. April–March with an adjustment period. */
export function buildFiscalCalendar({
  startMonth,
  firstYear,
  count,
  nameBy = 'end',
  adjustmentPeriod = false,
  closedBefore,
  locale = 'en-US',
}: BuildFiscalCalendarOptions): FiscalCalendar {
  const months = monthNames(locale, 'short')
  const years: FiscalYear[] = []
  for (let n = 0; n < count; n++) {
    const fyName = firstYear + n
    const startYear = nameBy === 'end' && startMonth > 1 ? fyName - 1 : fyName
    const start = `${String(startYear)}-${String(startMonth).padStart(2, '0')}-01`
    const periods: FiscalPeriod[] = []
    for (let p = 0; p < 12; p++) {
      const from = addMonths(start, p)
      const to = endOfMonth(from)
      const num = String(p + 1).padStart(2, '0')
      periods.push({
        key: `FY${String(fyName)}-P${num}`,
        label: `P${num} · ${months[Number(from.slice(5, 7)) - 1] ?? ''} ${from.slice(0, 4)}`,
        from,
        to,
        closed: closedBefore !== undefined && to < closedBefore,
      })
    }
    if (adjustmentPeriod) {
      const last = addDays(addMonths(start, 12), -1)
      periods.push({
        key: `FY${String(fyName)}-P13`,
        label: 'P13 · Adjustments',
        from: last,
        to: last,
        closed: closedBefore !== undefined && last < closedBefore,
      })
    }
    years.push({ key: `FY${String(fyName)}`, label: `FY ${String(fyName)}`, periods })
  }
  return { years }
}

/** The period that contains a date. */
export function periodForDate(calendar: FiscalCalendar, iso: string): FiscalPeriod | undefined {
  for (const y of calendar.years) {
    const found = y.periods.find((p) => p.from <= iso && iso <= p.to && !p.key.endsWith('P13'))
    if (found) return found
  }
  return undefined
}

export function findPeriod(calendar: FiscalCalendar, key: string): { year: FiscalYear; period: FiscalPeriod } | undefined {
  for (const year of calendar.years) {
    const period = year.periods.find((p) => p.key === key)
    if (period) return { year, period }
  }
  return undefined
}
