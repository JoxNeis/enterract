import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatDateTime } from '../../utils/format'
import { Icon, type IconName } from '../Icon'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './WorkflowTimeline.css'

export type TimelineState = 'done' | 'current' | 'pending' | 'rejected' | 'skipped'

export interface TimelineEvent {
  id: string
  title: ReactNode
  state: TimelineState
  /** Who did it (or is expected to). */
  actor?: string
  /** ISO 8601 instant. */
  at?: string
  comment?: ReactNode
}

export interface WorkflowTimelineProps extends ComponentProps<'ol'> {
  events: readonly TimelineEvent[]
}

const stateIcon: Record<TimelineState, IconName | null> = {
  done: 'check',
  current: null,
  pending: null,
  rejected: 'close',
  skipped: 'arrow-down',
}
const stateText: Record<TimelineState, string> = {
  done: 'Done',
  current: 'In progress',
  pending: 'Pending',
  rejected: 'Rejected',
  skipped: 'Skipped',
}

/** History and next steps of a document's workflow, oldest first. */
export function WorkflowTimeline({ events, className, ...props }: WorkflowTimelineProps) {
  const { locale, timeZone } = useLocale()
  return (
    <ol
      className={cx('erp-workflow-timeline', className)}
      aria-label='Workflow history'
      {...props}
    >
      {events.map((e) => {
        const icon = stateIcon[e.state]
        return (
          <li
            key={e.id}
            className='erp-workflow-timeline__event'
            data-state={e.state}
            aria-current={e.state === 'current' ? 'step' : undefined}
          >
            <span
              className='erp-workflow-timeline__marker'
              aria-hidden='true'
            >
              {icon && <Icon name={icon} />}
            </span>
            <div className='erp-workflow-timeline__body'>
              <div className='erp-workflow-timeline__title'>
                <strong>{e.title}</strong>
                <span className='erp-workflow-timeline__state'>{stateText[e.state]}</span>
              </div>
              {(e.actor ?? e.at) && (
                <div className='erp-workflow-timeline__meta'>
                  {e.actor}
                  {e.actor && e.at && ' · '}
                  {e.at && <time dateTime={e.at}>{formatDateTime(e.at, locale, timeZone)}</time>}
                </div>
              )}
              {e.comment && <p className='erp-workflow-timeline__comment'>{e.comment}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
