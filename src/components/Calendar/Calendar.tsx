import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { cx } from '../../utils/cx'
import {
  addDays,
  addMonths,
  compareISO,
  formatDate,
  getWeekStart,
  isBetween,
  monthGrid,
  startOfMonth,
  todayISO,
  weekday,
  weekdayNames,
} from '../../utils/date'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './Calendar.css'

export interface CalendarProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'onSelect'> {
  /** Selected date, ISO `YYYY-MM-DD`. */
  value?: string | null
  defaultValue?: string | null
  /** Called when a date is picked (click, Enter or Space). */
  onChange?: (value: string | null) => void
  /** Highlights a range (DateRangePicker). */
  rangeStart?: string | null
  rangeEnd?: string | null
  /** Called when the pointer or focus moves over a date (range preview). */
  onDateHover?: (date: string | null) => void
  min?: string
  max?: string
  /** Disable specific dates (holidays, closed periods). */
  isDateDisabled?: (date: string) => boolean
  /** Today's date. Pass a fixed value in stories and tests. */
  today?: string
  locale?: string
  /** 0 = Sunday. Defaults to the locale. */
  weekStartsOn?: number
  /** Months shown side by side. */
  numberOfMonths?: 1 | 2
  /** First visible month (any date in it). */
  defaultMonth?: string
  /** Focus the active day on mount (inside a popover). */
  autoFocus?: boolean
  /** Not interactive. */
  disabled?: boolean
  /** Focusable but dates can't be picked. */
  readOnly?: boolean
}

/**
 * Month grid date picker (WAI-ARIA date picker dialog grid). Shared by DatePicker,
 * DateRangePicker and DateTimePicker. Arrows move by day/week, PageUp/PageDown by month
 * (Shift: year), Home/End to the week start/end, Enter/Space pick.
 */
export function Calendar({
  value,
  defaultValue = null,
  onChange,
  rangeStart,
  rangeEnd,
  onDateHover,
  min,
  max,
  isDateDisabled,
  today: todayProp,
  locale: localeProp,
  weekStartsOn: weekStartsOnProp,
  numberOfMonths = 1,
  defaultMonth,
  autoFocus = false,
  disabled = false,
  readOnly = false,
  className,
  ...props
}: CalendarProps) {
  const settings = useLocale(localeProp)
  const { locale } = settings
  const weekStart = weekStartsOnProp ?? settings.weekStartsOn ?? getWeekStart(locale)
  const [today] = useState(() => todayProp ?? todayISO())
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const initial = current ?? rangeStart ?? defaultMonth ?? today
  const [focusDate, setFocusDate] = useState(initial)
  const [viewMonth, setViewMonth] = useState(startOfMonth(initial))
  const gridRef = useRef<HTMLDivElement>(null)
  const shouldFocus = useRef(autoFocus)
  const titleId = useId()

  useEffect(() => {
    if (!shouldFocus.current) return
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus()
  }, [focusDate, viewMonth])

  const months = Array.from({ length: numberOfMonths }, (_, i) => addMonths(viewMonth, i))
  const lastMonth = months[months.length - 1] ?? viewMonth
  const isDisabled = (iso: string) => !isBetween(iso, min, max) || Boolean(isDateDisabled?.(iso))

  const moveTo = (iso: string) => {
    const clamped = min && iso < min ? min : max && iso > max ? max : iso
    setFocusDate(clamped)
    const month = startOfMonth(clamped)
    if (month < viewMonth) setViewMonth(month)
    else if (month > startOfMonth(lastMonth)) setViewMonth(addMonths(month, -(numberOfMonths - 1)))
  }

  const shiftView = (months: number) => {
    setViewMonth(addMonths(viewMonth, months))
    setFocusDate(addMonths(focusDate, months))
  }

  const pick = (iso: string) => {
    if (disabled || readOnly || isDisabled(iso)) return
    setCurrent(iso)
  }

  const onDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, iso: string) => {
    const dow = (weekday(iso) - weekStart + 7) % 7
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(iso, -1),
      ArrowRight: () => addDays(iso, 1),
      ArrowUp: () => addDays(iso, -7),
      ArrowDown: () => addDays(iso, 7),
      Home: () => addDays(iso, -dow),
      End: () => addDays(iso, 6 - dow),
      PageUp: () => addMonths(iso, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(iso, event.shiftKey ? 12 : 1),
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      shouldFocus.current = true
      const next = move()
      moveTo(next)
      onDateHover?.(next)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(iso)
    }
  }

  const weekdays = weekdayNames(locale, 'short', weekStart)
  const weekdaysLong = weekdayNames(locale, 'long', weekStart)
  const monthTitle = (iso: string) => formatDate(iso, locale, { month: 'long', year: 'numeric' })
  const rangeLo = rangeStart && rangeEnd && compareISO(rangeStart, rangeEnd) > 0 ? rangeEnd : rangeStart
  const rangeHi = rangeStart && rangeEnd && compareISO(rangeStart, rangeEnd) > 0 ? rangeStart : rangeEnd

  return (
    <div
      className={cx('erp-calendar', className)}
      role='group'
      aria-labelledby={titleId}
      data-disabled={flag(disabled)}
      {...props}
      onFocus={() => {
        shouldFocus.current = true
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) shouldFocus.current = false
      }}
    >
      <div className='erp-calendar__header'>
        <button
          type='button'
          className='erp-input-action'
          aria-label='Previous year'
          disabled={disabled}
          onClick={() => {
            shiftView(-12)
          }}
        >
          <Icon name='chevrons-left' />
        </button>
        <button
          type='button'
          className='erp-input-action'
          aria-label='Previous month'
          disabled={disabled}
          onClick={() => {
            shiftView(-1)
          }}
        >
          <Icon name='chevron-left' />
        </button>
        <span
          id={titleId}
          className='erp-calendar__title'
          aria-live='polite'
        >
          {months.map(monthTitle).join(' – ')}
        </span>
        <button
          type='button'
          className='erp-input-action'
          aria-label='Next month'
          disabled={disabled}
          onClick={() => {
            shiftView(1)
          }}
        >
          <Icon name='chevron-right' />
        </button>
        <button
          type='button'
          className='erp-input-action'
          aria-label='Next year'
          disabled={disabled}
          onClick={() => {
            shiftView(12)
          }}
        >
          <Icon name='chevrons-right' />
        </button>
      </div>
      <div
        className='erp-calendar__months'
        ref={gridRef}
      >
        {months.map((month) => (
          <table
            key={month}
            role='grid'
            className='erp-calendar__grid'
            aria-label={monthTitle(month)}
          >
            {numberOfMonths > 1 && <caption className='erp-calendar__caption'>{monthTitle(month)}</caption>}
            <thead>
              <tr>
                {weekdays.map((d, i) => (
                  <th
                    key={d}
                    scope='col'
                    abbr={weekdaysLong[i]}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody onMouseLeave={() => onDateHover?.(null)}>
              {monthGrid(month, weekStart).map((week) => (
                <tr key={week[0]}>
                  {week.map((iso) => {
                    const outside = iso.slice(0, 7) !== month.slice(0, 7)
                    if (outside && numberOfMonths > 1) return <td key={iso} />
                    const selected = iso === current || iso === rangeLo || iso === rangeHi
                    const inRange = Boolean(rangeLo && rangeHi && iso > rangeLo && iso < rangeHi)
                    const dayDisabled = isDisabled(iso)
                    return (
                      <td
                        key={iso}
                        role='gridcell'
                        aria-selected={selected}
                      >
                        <button
                          type='button'
                          className='erp-calendar__day'
                          data-date={iso}
                          data-outside={flag(outside)}
                          data-today={flag(iso === today)}
                          data-selected={flag(selected)}
                          data-in-range={flag(inRange)}
                          data-range-start={flag(iso === rangeLo)}
                          data-range-end={flag(iso === rangeHi)}
                          tabIndex={iso === focusDate ? 0 : -1}
                          disabled={disabled}
                          aria-disabled={flag(dayDisabled || readOnly)}
                          aria-current={iso === today ? 'date' : undefined}
                          aria-label={formatDate(iso, locale, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          onClick={() => {
                            setFocusDate(iso)
                            pick(iso)
                          }}
                          onMouseEnter={() => onDateHover?.(iso)}
                          onKeyDown={(event) => {
                            onDayKeyDown(event, iso)
                          }}
                        >
                          {Number(iso.slice(8))}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  )
}
