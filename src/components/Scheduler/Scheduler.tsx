import { useState, type ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { addDays, formatDate, formatTime, getWeekStart, todayISO, weekday } from '../../utils/date'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { useLocale } from '../LocaleProvider'
import { layoutDay } from './layoutDay'
import './Scheduler.css'

export interface SchedulerEvent {
  id: string
  title: string
  /** Local date-time `YYYY-MM-DDTHH:mm`. */
  start: string
  end: string
  location?: string
  /** Chart palette slot 1–8 for the color strip (identity, e.g. a meeting room). */
  category?: number
}

export type SchedulerView = 'day' | 'workweek' | 'week'

export interface SchedulerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  events: readonly SchedulerEvent[]
  /** Any date in the visible period (ISO). */
  date?: string
  defaultDate?: string
  onDateChange?: (date: string) => void
  view?: SchedulerView
  defaultView?: SchedulerView
  onViewChange?: (view: SchedulerView) => void
  startHour?: number
  endHour?: number
  slotMinutes?: number
  today?: string
  onEventClick?: (event: SchedulerEvent) => void
  /** Click or Enter on an empty slot: `YYYY-MM-DDTHH:mm`. */
  onSlotClick?: (start: string) => void
  'aria-label': string
}

const SLOT_PX = 24

const minutesOf = (dt: string) => {
  const [h = 0, m = 0] = (dt.split('T')[1] ?? '00:00').split(':').map(Number)
  return h * 60 + m
}

/**
 * Calendar of appointments by day, work week or week (deliveries, meetings, machine slots).
 * Events are buttons; empty slots are buttons that create an event at that time.
 */
export function Scheduler({
  events,
  date,
  defaultDate,
  onDateChange,
  view,
  defaultView = 'workweek',
  onViewChange,
  startHour = 7,
  endHour = 19,
  slotMinutes = 30,
  today: todayProp,
  onEventClick,
  onSlotClick,
  className,
  'aria-label': ariaLabel,
  ...props
}: SchedulerProps) {
  const settings = useLocale()
  const { locale } = settings
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const [current, setCurrent] = useControllableState({ value: date, defaultValue: defaultDate ?? today, onChange: onDateChange })
  const [mode, setMode] = useControllableState<SchedulerView>({ value: view, defaultValue: defaultView, onChange: onViewChange })
  const weekStart = mode === 'workweek' ? 1 : (settings.weekStartsOn ?? getWeekStart(locale))
  const first = mode === 'day' ? current : addDays(current, -((weekday(current) - weekStart + 7) % 7))
  const dayCount = mode === 'day' ? 1 : mode === 'workweek' ? 5 : 7
  const days = Array.from({ length: dayCount }, (_, i) => addDays(first, i))
  const slots = Array.from({ length: ((endHour - startHour) * 60) / slotMinutes }, (_, i) => startHour * 60 + i * slotMinutes)
  const step = mode === 'day' ? 1 : 7
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const title =
    dayCount === 1
      ? formatDate(first, locale, { dateStyle: 'full' })
      : `${formatDate(first, locale, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(first, dayCount - 1), locale, { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div
      className={cx('erp-scheduler', className)}
      role='group'
      aria-label={ariaLabel}
      {...props}
    >
      <div className='erp-scheduler__toolbar'>
        <IconButton
          icon='chevron-left'
          aria-label={mode === 'day' ? 'Previous day' : 'Previous week'}
          size='sm'
          onClick={() => {
            setCurrent(addDays(current, -step))
          }}
        />
        <Button
          size='sm'
          onClick={() => {
            setCurrent(today)
          }}
        >
          Today
        </Button>
        <IconButton
          icon='chevron-right'
          aria-label={mode === 'day' ? 'Next day' : 'Next week'}
          size='sm'
          onClick={() => {
            setCurrent(addDays(current, step))
          }}
        />
        <h3
          className='erp-scheduler__title'
          aria-live='polite'
        >
          {title}
        </h3>
        <div
          className='erp-scheduler__views'
          role='radiogroup'
          aria-label='View'
        >
          {(['day', 'workweek', 'week'] as const).map((v) => (
            <button
              key={v}
              type='button'
              role='radio'
              aria-checked={mode === v}
              onClick={() => {
                setMode(v)
              }}
            >
              {v === 'day' ? 'Day' : v === 'workweek' ? 'Work week' : 'Week'}
            </button>
          ))}
        </div>
      </div>
      <div
        className='erp-scheduler__grid'
        style={{ gridTemplateColumns: `3.5rem repeat(${String(dayCount)}, minmax(7rem, 1fr))` }}
      >
        <div className='erp-scheduler__corner' />
        {days.map((d) => (
          <div
            key={d}
            className='erp-scheduler__day-header'
            data-today={flag(d === today)}
          >
            {formatDate(d, locale, { weekday: 'short', day: 'numeric' })}
          </div>
        ))}
        <div className='erp-scheduler__gutter'>
          {slots.map((m) => (
            <div
              key={m}
              className='erp-scheduler__time'
              style={{ height: SLOT_PX }}
            >
              {m % 60 === 0 ? formatTime(hhmm(m), locale) : ''}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayEvents = events.filter((e) => e.start.slice(0, 10) === d)
          return (
            <section
              key={d}
              className='erp-scheduler__column'
              aria-label={formatDate(d, locale, { weekday: 'long', month: 'long', day: 'numeric' })}
              data-today={flag(d === today)}
              style={{ height: slots.length * SLOT_PX }}
            >
              {slots.map((m) => (
                <button
                  key={m}
                  type='button'
                  className='erp-scheduler__slot'
                  style={{ height: SLOT_PX }}
                  aria-label={`${formatDate(d, locale, { weekday: 'long' })} ${formatTime(hhmm(m), locale)}, new event`}
                  tabIndex={onSlotClick ? 0 : -1}
                  disabled={!onSlotClick}
                  onClick={() => onSlotClick?.(`${d}T${hhmm(m)}`)}
                />
              ))}
              {layoutDay(dayEvents).map(({ event, lane, lanes }) => {
                const top = ((minutesOf(event.start) - startHour * 60) / slotMinutes) * SLOT_PX
                const height = Math.max(SLOT_PX - 2, ((minutesOf(event.end) - minutesOf(event.start)) / slotMinutes) * SLOT_PX - 2)
                const time = `${formatTime(event.start.slice(11, 16), locale)} – ${formatTime(event.end.slice(11, 16), locale)}`
                return (
                  <button
                    key={event.id}
                    type='button'
                    className='erp-scheduler__event'
                    style={{
                      top,
                      height,
                      left: `calc(${String((lane / lanes) * 100)}% + 2px)`,
                      width: `calc(${String(100 / lanes)}% - 4px)`,
                      borderLeftColor: `var(--erp-chart-${String(Math.min(8, Math.max(1, event.category ?? 1)))})`,
                    }}
                    aria-label={`${event.title}, ${time}${event.location ? `, ${event.location}` : ''}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <span className='erp-scheduler__event-title'>{event.title}</span>
                    <span className='erp-scheduler__event-time'>{time}</span>
                    {event.location && <span className='erp-scheduler__event-time'>{event.location}</span>}
                  </button>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
