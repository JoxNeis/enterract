import { weekday } from '../../utils/date'
import type { Allocation } from './ResourcePlanner'

export const isWeekend = (iso: string) => weekday(iso) === 0 || weekday(iso) === 6

/** Load of one resource on one day. */
export function dayLoad(allocations: readonly Allocation[], resourceId: string, date: string, includeWeekends = false): number {
  if (!includeWeekends && isWeekend(date)) return 0
  return allocations.filter((a) => a.resourceId === resourceId && a.start <= date && date <= a.end).reduce((s, a) => s + a.hours, 0)
}
