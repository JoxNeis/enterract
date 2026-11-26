import { useState, type ComponentProps, type KeyboardEvent } from 'react'
import { cx } from '../../utils/cx'
import { addDays, daysBetween, formatDate, todayISO, weekday } from '../../utils/date'
import { flag } from '../../utils/flag'
import { formatNumber } from '../../utils/number'
import { useLocale } from '../LocaleProvider'
import './GanttChart.css'

export interface GanttTask {
  id: string
  name: string
  /** ISO start date. */
  start: string
  /** ISO end date (inclusive). */
  end: string
  /** 0–1 */
  progress?: number
  /** Ids of tasks that must finish first. */
  dependsOn?: string[]
  /** Shown as a diamond on `start`. */
  milestone?: boolean
}

export interface GanttChartProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  tasks: readonly GanttTask[]
  /** First visible day. Defaults to the earliest task start minus 2 days. */
  from?: string
  /** Last visible day. Defaults to the latest end plus 2 days. */
  to?: string
  /** Width of one day in px. */
  dayWidth?: number
  /** Today marker (fixed date for stories and tests). */
  today?: string
  /** Lets users move (←/→) and resize (Shift+←/→) bars with the keyboard. */
  onTaskChange?: (task: GanttTask) => void
  onTaskClick?: (task: GanttTask) => void
  'aria-label': string
}

const ROW = 32

/**
 * Project schedule: tasks as bars on a day timeline with progress, milestones, dependencies
 * and a today marker. Focus a bar and use ←/→ to move it, Shift+←/→ to change its end.
 */
export function GanttChart({
  tasks,
  from: fromProp,
  to: toProp,
  dayWidth = 28,
  today: todayProp,
  onTaskChange,
  onTaskClick,
  className,
  'aria-label': ariaLabel,
  ...props
}: GanttChartProps) {
  const { locale } = useLocale()
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const starts = tasks.map((t) => t.start).sort()
  const ends = tasks.map((t) => t.end).sort()
  const from = fromProp ?? addDays(starts[0] ?? today, -2)
  const to = toProp ?? addDays(ends[ends.length - 1] ?? today, 2)
  const days = Math.max(1, daysBetween(from, to) + 1)
  const width = days * dayWidth
  const x = (iso: string) => daysBetween(from, iso) * dayWidth
  const index = new Map(tasks.map((t, i) => [t.id, i]))
  const fmt = (iso: string) => formatDate(iso, locale, { month: 'short', day: 'numeric' })

  const months: { label: string; start: number; span: number }[] = []
  for (let d = 0; d < days; d++) {
    const iso = addDays(from, d)
    const label = formatDate(iso, locale, { month: 'long', year: 'numeric' })
    const last = months[months.length - 1]
    if (last?.label === label) last.span += 1
    else months.push({ label, start: d, span: 1 })
  }

  const onBarKey = (event: KeyboardEvent<HTMLButtonElement>, task: GanttTask) => {
    if (!onTaskChange || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? 1 : -1
    if (event.shiftKey && !task.milestone) {
      const end = addDays(task.end, delta)
      if (end >= task.start) onTaskChange({ ...task, end })
    } else {
      onTaskChange({ ...task, start: addDays(task.start, delta), end: addDays(task.end, delta) })
    }
  }

  return (
    <div
      className={cx('erp-gantt', className)}
      role='group'
      aria-label={ariaLabel}
      {...props}
    >
      <table className='erp-gantt__list'>
        <thead>
          <tr>
            <th scope='col'>Task</th>
            <th scope='col'>Start</th>
            <th scope='col'>End</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <th scope='row'>{t.name}</th>
              <td>{fmt(t.start)}</td>
              <td>{t.milestone ? '—' : fmt(t.end)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='erp-gantt__chart'>
        <div
          className='erp-gantt__timeline'
          style={{ width }}
        >
          <div
            className='erp-gantt__months'
            aria-hidden='true'
          >
            {months.map((m) => (
              <span
                key={m.label}
                style={{ left: m.start * dayWidth, width: m.span * dayWidth }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div
            className='erp-gantt__days'
            aria-hidden='true'
          >
            {Array.from({ length: days }, (_, d) => {
              const iso = addDays(from, d)
              const wd = weekday(iso)
              return (
                <span
                  key={iso}
                  style={{ left: d * dayWidth, width: dayWidth }}
                  data-weekend={flag(wd === 0 || wd === 6)}
                >
                  {Number(iso.slice(8))}
                </span>
              )
            })}
          </div>
          <div
            className='erp-gantt__body'
            style={{ height: tasks.length * ROW }}
          >
            {Array.from({ length: days }, (_, d) => {
              const wd = weekday(addDays(from, d))
              return wd === 0 || wd === 6 ? (
                <span
                  key={d}
                  className='erp-gantt__weekend'
                  style={{ left: d * dayWidth, width: dayWidth }}
                />
              ) : null
            })}
            {today >= from && today <= to && (
              <span
                className='erp-gantt__today'
                style={{ left: x(today) + dayWidth / 2 }}
                title={`Today, ${fmt(today)}`}
              />
            )}
            <svg
              className='erp-gantt__links'
              width={width}
              height={tasks.length * ROW}
              aria-hidden='true'
            >
              {tasks.flatMap((t, i) =>
                (t.dependsOn ?? []).map((dep) => {
                  const j = index.get(dep)
                  const before = j === undefined ? undefined : tasks[j]
                  if (!before || j === undefined) return null
                  const x1 = x(before.end) + dayWidth
                  const y1 = j * ROW + ROW / 2
                  const x2 = x(t.start)
                  const y2 = i * ROW + ROW / 2
                  const mid = Math.max(x1 + 6, x2 - 6)
                  return (
                    <path
                      key={`${dep}-${t.id}`}
                      d={`M${String(x1)},${String(y1)}H${String(mid)}V${String(y2)}H${String(x2)}`}
                      markerEnd='url(#erp-gantt-arrow)'
                    />
                  )
                })
              )}
              <defs>
                <marker
                  id='erp-gantt-arrow'
                  viewBox='0 0 6 6'
                  refX='6'
                  refY='3'
                  markerWidth='6'
                  markerHeight='6'
                  orient='auto'
                >
                  <path d='M0,0L6,3L0,6Z' />
                </marker>
              </defs>
            </svg>
            {tasks.map((t, i) => {
              const left = x(t.start)
              const barWidth = t.milestone ? 0 : (daysBetween(t.start, t.end) + 1) * dayWidth
              const pct = Math.round((t.progress ?? 0) * 100)
              const late = !t.milestone && t.end < today && (t.progress ?? 0) < 1
              const label = t.milestone
                ? `${t.name}, milestone on ${fmt(t.start)}`
                : `${t.name}, ${fmt(t.start)} to ${fmt(t.end)}, ${formatNumber(pct, locale)}% complete${late ? ', late' : ''}`
              return (
                <button
                  key={t.id}
                  type='button'
                  className='erp-gantt__bar'
                  data-milestone={flag(t.milestone)}
                  data-late={flag(late)}
                  aria-label={label}
                  aria-keyshortcuts={onTaskChange ? 'ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight' : undefined}
                  style={{ top: i * ROW + 6, left: t.milestone ? left + dayWidth / 2 - 9 : left, width: t.milestone ? 18 : barWidth }}
                  onClick={() => onTaskClick?.(t)}
                  onKeyDown={(event) => {
                    onBarKey(event, t)
                  }}
                >
                  {!t.milestone && (
                    <span
                      className='erp-gantt__progress'
                      style={{ width: `${String(pct)}%` }}
                    />
                  )}
                  {!t.milestone && barWidth > 60 && <span className='erp-gantt__bar-label'>{pct}%</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
