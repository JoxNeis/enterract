import { useState, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatDate } from '../../utils/date'
import { formatDateTime, initials } from '../../utils/format'
import { Button } from '../Button'
import { useLocale } from '../LocaleProvider'
import './ActivityFeed.css'

export interface FieldChange {
  field: string
  from: ReactNode
  to: ReactNode
}

export interface ActivityEntry {
  id: string
  /** Who did it. */
  actor: string
  /** What happened, e.g. "changed", "posted", "created". */
  action: string
  /** What it happened to, e.g. "SO-1043". */
  target?: ReactNode
  /** ISO 8601 instant. */
  at: string
  /** Field-level changes (audit trail). */
  changes?: readonly FieldChange[]
  /** Kind of entry, for filtering and styling (e.g. `edit`, `status`, `comment`). */
  type?: string
}

export interface ActivityFeedProps extends Omit<ComponentProps<'section'>, 'title'> {
  entries: readonly ActivityEntry[]
  title?: ReactNode
  /** Loads older entries. Shows a button while `hasMore`. */
  onLoadMore?: () => void | Promise<void>
  hasMore?: boolean
  emptyText?: ReactNode
}

/** Audit trail of a record: who changed what and when, grouped by day, newest first. */
export function ActivityFeed({
  entries,
  title = 'Activity',
  onLoadMore,
  hasMore = false,
  emptyText = 'No activity yet',
  className,
  ...props
}: ActivityFeedProps) {
  const { locale, timeZone } = useLocale()
  const [loading, setLoading] = useState(false)
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at))
  const dayOf = (iso: string) => formatDateTime(iso, 'en-CA', timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const groups: { day: string; items: ActivityEntry[] }[] = []
  for (const e of sorted) {
    const day = dayOf(e.at)
    const last = groups[groups.length - 1]
    if (last?.day === day) last.items.push(e)
    else groups.push({ day, items: [e] })
  }

  return (
    <section
      className={cx('erp-activity-feed', className)}
      aria-label={typeof title === 'string' ? title : 'Activity'}
      {...props}
    >
      {title && <h3 className='erp-activity-feed__title'>{title}</h3>}
      {groups.length === 0 && <p className='erp-empty'>{emptyText}</p>}
      {groups.map((g) => (
        <div
          key={g.day}
          className='erp-activity-feed__day'
        >
          <h4 className='erp-activity-feed__date'>{formatDate(g.day, locale, { dateStyle: 'full' })}</h4>
          <ul className='erp-activity-feed__list'>
            {g.items.map((e) => (
              <li
                key={e.id}
                className='erp-activity-feed__entry'
                data-type={e.type}
              >
                <span
                  className='erp-activity-feed__avatar'
                  aria-hidden='true'
                >
                  {initials(e.actor)}
                </span>
                <div className='erp-activity-feed__body'>
                  <p className='erp-activity-feed__text'>
                    <strong>{e.actor}</strong> {e.action} {e.target && <span className='erp-activity-feed__target'>{e.target}</span>}
                    <time
                      dateTime={e.at}
                      className='erp-activity-feed__time'
                    >
                      {formatDateTime(e.at, locale, timeZone, { timeStyle: 'short' })}
                    </time>
                  </p>
                  {e.changes && e.changes.length > 0 && (
                    <table className='erp-activity-feed__changes'>
                      <thead className='erp-visually-hidden'>
                        <tr>
                          <th scope='col'>Field</th>
                          <th scope='col'>Before</th>
                          <th scope='col'>After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.changes.map((c) => (
                          <tr key={c.field}>
                            <th scope='row'>{c.field}</th>
                            <td className='erp-activity-feed__from'>
                              <del>{c.from ?? '—'}</del>
                            </td>
                            <td className='erp-activity-feed__to'>
                              <ins>{c.to ?? '—'}</ins>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {hasMore && onLoadMore && (
        <Button
          size='sm'
          variant='ghost'
          loading={loading}
          onClick={() => {
            setLoading(true)
            void Promise.resolve(onLoadMore()).finally(() => {
              setLoading(false)
            })
          }}
        >
          Load older activity
        </Button>
      )}
    </section>
  )
}
