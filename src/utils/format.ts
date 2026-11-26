/** `1.5 MB`, `320 KB`, `12 B` in the given locale. */
export function formatBytes(bytes: number, locale = 'en-US'): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${units[unit] ?? 'B'}`
}

/** Date and time of an ISO instant in a time zone (`Mar 15, 2026, 9:30 AM`). */
export function formatDateTime(
  iso: string | null | undefined,
  locale: string,
  timeZone = 'UTC',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return ''
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(ms))
}

/** Initials for an avatar: "Ana Pérez" → "AP". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}
