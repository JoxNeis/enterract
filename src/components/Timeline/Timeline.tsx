import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { addDays, addMonths, daysBetween, formatDate, startOfMonth, todayISO } from '../../utils/date'
import { flag } from '../../utils/flag'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './Timeline.css'

export interface TimelineItem {
  id: string
  /** ISO date. */
  date: string
  title: string
  description?: ReactNode
  /** Status meaning; shown with a text label, never color alone. */
  status?: 'done' | 'planned' | 'at-risk' | 'missed'
}

export interface TimelineProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly TimelineItem[]
  /** Axis start (ISO). Defaults to the first item's month. */
  from?: string
  /** Axis end (ISO). Defaults to the end of the last item's month. */
  to?: string
  today?: string
  /** `horizontal` draws a scaled axis; `vertical` is a dated list (better on narrow screens). */
  orientation?: 'horizontal' | 'vertical'
  'aria-label': string
}

const statusText = { done: 'Done', planned: 'Planned', 'at-risk': 'At risk', missed: 'Missed' } as const

/** Dated milestones on a time axis (contract dates, project phases, audits). */
export function Timeline({ items, from: fromProp, to: toProp, today: todayProp, orientation = 'horizontal', className, 'aria-label': ariaLabel, ...props }: TimelineProps) {
  const { locale } = useLocale()
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  const from = fromProp ?? startOfMonth(sorted[0]?.date ?? today)
  const to = toProp ?? addDays(addMonths(startOfMonth(sorted[sorted.length - 1]?.date ?? today), 1), -1)
  const span = Math.max(1, daysBetween(from, to))
  const pct = (iso: string) => Math.max(0, Math.min(100, (daysBetween(from, iso) / span) * 100))
  const months: string[] = []
  for (let m = startOfMonth(from); m <= to; m = addMonths(m, 1)) months.push(m)

  return (
    <div
      className={cx('erp-timeline', className)}
      data-orientation={orientation}
      {...props}
    >
      {orientation === 'horizontal' && (
        <div
          className='erp-timeline__axis'
          aria-hidden='true'
        >
          {months.map((m) => (
            <span
              key={m}
              className='erp-timeline__tick'
              style={{ left: `${String(pct(m))}%` }}
            >
              {formatDate(m, locale, { month: 'short', year: '2-digit' })}
            </span>
          ))}
          {today >= from && today <= to && (
            <span
              className='erp-timeline__today'
              style={{ left: `${String(pct(today))}%` }}
            >
              Today
            </span>
          )}
        </div>
      )}
      <ol
        className='erp-timeline__items'
        aria-label={ariaLabel}
      >
        {sorted.map((item, i) => (
          <li
            key={item.id}
            className='erp-timeline__item'
            data-status={item.status}
            data-side={i % 2 === 0 ? 'above' : 'below'}
            data-past={flag(item.date < today)}
            style={orientation === 'horizontal' ? { left: `${String(pct(item.date))}%` } : undefined}
          >
            <span
              className='erp-timeline__dot'
              aria-hidden='true'
            />
            <div className='erp-timeline__card'>
              <time dateTime={item.date}>{formatDate(item.date, locale, { dateStyle: 'medium' })}</time>
              <strong>{item.title}</strong>
              {item.status && <span className='erp-timeline__status'>{statusText[item.status]}</span>}
              {item.description && <div className='erp-timeline__description'>{item.description}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
