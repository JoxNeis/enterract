import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { addDays, daysBetween, formatDate, todayISO } from '../../utils/date'
import { flag } from '../../utils/flag'
import { formatNumber } from '../../utils/number'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { dayLoad, isWeekend } from './dayLoad'
import '../../styles/base.css'
import './ResourcePlanner.css'

export interface PlannerResource {
  id: string
  name: string
  /** Hours available per working day. */
  capacity?: number
  role?: string
}

export interface Allocation {
  id: string
  resourceId: string
  title: string
  /** ISO dates, inclusive. */
  start: string
  end: string
  /** Hours per working day. */
  hours: number
  /** Chart palette slot 1–8 (e.g. per project). */
  category?: number
}

export interface ResourcePlannerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  resources: readonly PlannerResource[]
  allocations: readonly Allocation[]
  /** First visible day (ISO). */
  start: string
  days?: number
  today?: string
  /** Count weekends as working days. */
  includeWeekends?: boolean
  onAllocationClick?: (allocation: Allocation) => void
  /** Empty day cell: create an allocation there. */
  onCellClick?: (resourceId: string, date: string) => void
  'aria-label': string
}

/**
 * People or machines × days: allocations as bars, daily load against capacity, and
 * over-allocation flagged with an icon and text (not color alone).
 */
export function ResourcePlanner({
  resources,
  allocations,
  start,
  days = 14,
  today: todayProp,
  includeWeekends = false,
  onAllocationClick,
  onCellClick,
  className,
  'aria-label': ariaLabel,
  ...props
}: ResourcePlannerProps) {
  const { locale } = useLocale()
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i))
  const end = dates[dates.length - 1] ?? start

  return (
    <div
      className={cx('erp-resource-planner', className)}
      {...props}
    >
      <table aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope='col'>Resource</th>
            {dates.map((d) => (
              <th
                key={d}
                scope='col'
                data-weekend={flag(isWeekend(d))}
                data-today={flag(d === today)}
              >
                <span className='erp-resource-planner__dow'>{formatDate(d, locale, { weekday: 'narrow' })}</span>
                {Number(d.slice(8))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => {
            const capacity = r.capacity ?? 8
            const mine = allocations.filter((a) => a.resourceId === r.id && a.end >= start && a.start <= end)
            const total = dates.reduce((s, d) => s + dayLoad(allocations, r.id, d, includeWeekends), 0)
            const available = dates.filter((d) => includeWeekends || !isWeekend(d)).length * capacity
            return (
              <tr key={r.id}>
                <th scope='row'>
                  <span className='erp-resource-planner__name'>{r.name}</span>
                  {r.role && <span className='erp-resource-planner__role'>{r.role}</span>}
                  <span className='erp-resource-planner__util'>
                    {formatNumber(available ? (total / available) * 100 : 0, locale, { maximumFractionDigits: 0 })}% booked
                  </span>
                </th>
                {dates.map((d, i) => {
                  const load = dayLoad(allocations, r.id, d, includeWeekends)
                  const over = load > capacity
                  const level = load === 0 ? 0 : Math.min(4, Math.ceil((load / capacity) * 4))
                  const starting = mine.filter((a) => a.start === d || (i === 0 && a.start < start))
                  return (
                    <td
                      key={d}
                      data-weekend={flag(isWeekend(d))}
                      data-load={level}
                      data-over={flag(over)}
                      aria-label={`${r.name}, ${formatDate(d, locale, { weekday: 'long', month: 'short', day: 'numeric' })}: ${formatNumber(load, locale)} of ${formatNumber(capacity, locale)} hours${over ? ', over-allocated' : ''}`}
                      className='erp-resource-planner__cell'
                      tabIndex={onCellClick ? 0 : undefined}
                      onClick={(event) => {
                        if (event.target === event.currentTarget) onCellClick?.(r.id, d)
                      }}
                      onKeyDown={(event) => {
                        if (onCellClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          onCellClick(r.id, d)
                        }
                      }}
                    >
                      {over && (
                        <Icon
                          name='warning'
                          className='erp-resource-planner__over'
                        />
                      )}
                      {starting.map((a) => {
                        const visibleStart = a.start < start ? start : a.start
                        const visibleEnd = a.end > end ? end : a.end
                        const span = daysBetween(visibleStart, visibleEnd) + 1
                        return (
                          <button
                            key={a.id}
                            type='button'
                            className='erp-resource-planner__bar'
                            style={{
                              width: `calc(${String(span * 100)}% + ${String(span - 1)}px - 4px)`,
                              borderLeftColor: `var(--erp-chart-${String(Math.min(8, Math.max(1, a.category ?? 1)))})`,
                              top: `${String(4 + mine.filter((x) => x.start <= a.start && x.id < a.id && x.end >= a.start).length * 22)}px`,
                            }}
                            aria-label={`${a.title}, ${r.name}, ${formatDate(a.start, locale)} to ${formatDate(a.end, locale)}, ${formatNumber(a.hours, locale)} hours a day`}
                            onClick={() => onAllocationClick?.(a)}
                          >
                            {a.title} · {formatNumber(a.hours, locale)}h
                          </button>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
