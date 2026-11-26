import type { RangeValue } from '../RangeFilter'

/** True when a filter value restricts the result. */
export function isFilterActive(value: unknown): boolean {
  if (value === null || value === undefined || value === '' || value === false) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    const range = value as Partial<RangeValue<unknown>>
    if ('from' in range || 'to' in range) return range.from != null || range.to != null
  }
  return true
}
