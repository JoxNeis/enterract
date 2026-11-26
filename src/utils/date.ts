import type { ParseResult } from './number'

/**
 * Date helpers working on ISO date strings (`YYYY-MM-DD`). Dates are calendar dates, not
 * instants, so all math runs in UTC and never shifts by the browser's time zone.
 */
export interface DateParts {
  year: number
  /** 1–12 */
  month: number
  day: number
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function parseISODate(value: string | null | undefined): DateParts | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null
}

export function toISODate({ year, month, day }: DateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

function fromUTC(date: Date): string {
  return toISODate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() })
}

function toUTC(iso: string): Date {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  return new Date(Date.UTC(p.year, p.month - 1, p.day))
}

export function addDays(iso: string, days: number): string {
  const d = toUTC(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUTC(d)
}

/** Adds months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  const total = p.year * 12 + (p.month - 1) + months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return toISODate({ year, month, day: Math.min(p.day, daysInMonth(year, month)) })
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12)
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function endOfMonth(iso: string): string {
  const p = parseISODate(iso)
  if (!p) throw new RangeError(`Invalid ISO date: ${iso}`)
  return toISODate({ ...p, day: daysInMonth(p.year, p.month) })
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(iso: string): number {
  return toUTC(iso).getUTCDay()
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86400000)
}

/** ISO strings sort lexically, so plain comparison works. */
export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function isBetween(iso: string, from?: string | null, to?: string | null): boolean {
  return (!from || iso >= from) && (!to || iso <= to)
}

/** Today in the browser's local time zone. Pass a fixed `today` prop in stories and tests. */
export function todayISO(): string {
  const d = new Date()
  return toISODate({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })
}

export function formatDate(
  iso: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
): string {
  if (!iso || !isValidISODate(iso)) return ''
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(toUTC(iso))
}

type DatePart = 'year' | 'month' | 'day'

/** Field order of the locale's short date (`['month','day','year']` for en-US). */
export function getDateOrder(locale: string): DatePart[] {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(2006, 0, 2)))
    .map((p) => p.type)
    .filter((t): t is DatePart => t === 'year' || t === 'month' || t === 'day')
}

/** Placeholder for typed dates, e.g. `MM/DD/YYYY`. */
export function datePlaceholder(locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(2006, 0, 2)))
  return parts
    .map((p) => (p.type === 'year' ? 'YYYY' : p.type === 'month' ? 'MM' : p.type === 'day' ? 'DD' : p.value))
    .join('')
}

/** Excel stores dates as days since 1899-12-30. */
export function fromExcelSerial(serial: number): string {
  return addDays('1899-12-30', Math.floor(serial))
}

export interface ParseDateOptions {
  /** Accept Excel serial numbers (used by grid paste). */
  allowSerial?: boolean
}

/** Parses ISO, the locale's short date format (`03/15/2026`, `15.03.2026`) and optionally Excel serials. */
export function parseDateText(text: string, locale: string, options: ParseDateOptions = {}): ParseResult<string> {
  const s = text.trim()
  if (s === '') return { ok: true, value: null }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(s)
  if (iso) {
    const value = toISODate({ year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) })
    return isValidISODate(value) ? { ok: true, value } : { ok: false }
  }

  if (options.allowSerial && /^\d{1,6}(\.\d+)?$/.test(s)) {
    const serial = Number(s)
    return serial >= 1 && serial < 2958466 ? { ok: true, value: fromExcelSerial(serial) } : { ok: false }
  }

  const pieces = s.split(/[^\d]+/).filter(Boolean)
  if (pieces.length !== 3) return { ok: false }
  const order = getDateOrder(locale)
  const parts: Partial<Record<DatePart, number>> = {}
  order.forEach((part, i) => {
    parts[part] = Number(pieces[i])
  })
  let year = parts.year ?? NaN
  const yearText = pieces[order.indexOf('year')] ?? ''
  if (yearText.length <= 2) year += year < 50 ? 2000 : 1900
  const value = toISODate({ year, month: parts.month ?? NaN, day: parts.day ?? NaN })
  return isValidISODate(value) ? { ok: true, value } : { ok: false }
}

interface WeekInfoLocale {
  getWeekInfo?: () => { firstDay: number }
  weekInfo?: { firstDay: number }
}

const SUNDAY_FIRST = /^(en-(US|CA|PH|IN)|ja|ko|zh-TW|he|pt-BR|id|th)/

/** First day of the week for a locale: 0 = Sunday, 1 = Monday. */
export function getWeekStart(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & WeekInfoLocale
    const info = loc.getWeekInfo ? loc.getWeekInfo() : loc.weekInfo
    if (info) return info.firstDay % 7
  } catch {
    // Fall back below.
  }
  return SUNDAY_FIRST.test(locale) ? 0 : 1
}

export function monthNames(locale: string, width: 'long' | 'short' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: width, timeZone: 'UTC' })
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2021, i, 1))))
}

/** Weekday names starting at `weekStart` (0 = Sunday). */
export function weekdayNames(locale: string, width: 'long' | 'short' | 'narrow' = 'short', weekStart = 0): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: width, timeZone: 'UTC' })
  // 2021-01-03 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2021, 0, 3 + ((i + weekStart) % 7)))))
}

/** 6×7 grid of ISO dates covering the month of `iso`. */
export function monthGrid(iso: string, weekStart: number): string[][] {
  const first = startOfMonth(iso)
  const offset = (weekday(first) - weekStart + 7) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
}

// ---------- Time ----------

/** True when the locale shows times on a 12-hour clock. */
export function uses12Hour(locale: string): boolean {
  const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle
  return cycle === 'h11' || cycle === 'h12'
}

/** Parses `14:30`, `2:30 pm`, `1430`, `2pm` to `HH:mm`. */
export function parseTimeText(text: string): ParseResult<string> {
  const s = text.trim().toLowerCase()
  if (s === '') return { ok: true, value: null }
  const m = /^(\d{1,2})(?::?(\d{2}))?(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?$/.exec(s)
  if (!m) return { ok: false }
  let hours = Number(m[1])
  const minutes = Number(m[2] ?? 0)
  const meridiem = m[4]
  if (meridiem) {
    if (hours < 1 || hours > 12) return { ok: false }
    if (meridiem === 'p' && hours < 12) hours += 12
    if (meridiem === 'a' && hours === 12) hours = 0
  }
  if (hours > 23 || minutes > 59) return { ok: false }
  return { ok: true, value: `${pad(hours)}:${pad(minutes)}` }
}

export function formatTime(value: string | null | undefined, locale: string): string {
  if (!value) return ''
  const [h = 0, m = 0] = value.split(':').map(Number)
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2021, 0, 1, h, m))
  )
}

// ---------- Date-time with explicit time zone ----------

/** Offset of a time zone at an instant, in minutes east of UTC. */
export function timeZoneOffset(epochMs: number, timeZone: string): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(new Date(epochMs))
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name)
  if (!m) return 0
  const minutes = Number(m[2]) * 60 + Number(m[3] ?? 0)
  return m[1] === '-' ? -minutes : minutes
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Wall-clock date and time in a time zone → ISO 8601 with offset (`2026-03-15T09:30:00+07:00`). */
export function zonedToISO(date: string, time: string, timeZone: string): string {
  const p = parseISODate(date)
  if (!p) throw new RangeError(`Invalid ISO date: ${date}`)
  const [h = 0, m = 0] = time.split(':').map(Number)
  const wall = Date.UTC(p.year, p.month - 1, p.day, h, m)
  let offset = timeZoneOffset(wall, timeZone)
  offset = timeZoneOffset(wall - offset * 60000, timeZone)
  return `${date}T${pad(h)}:${pad(m)}:00${formatOffset(offset)}`
}

/** ISO 8601 instant → wall-clock date and time in a time zone. */
export function isoToZoned(iso: string, timeZone: string): { date: string; time: string } | null {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return null
  const local = new Date(ms + timeZoneOffset(ms, timeZone) * 60000)
  return {
    date: fromUTC(local),
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
  }
}
