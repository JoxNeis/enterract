import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { documentStatuses, type StatusDefinition, type StatusTone } from './statuses'
import './StatusBadge.css'

export interface StatusBadgeProps extends ComponentProps<'span'> {
  /** Status key, e.g. `draft`, `pending-approval`, `posted`. */
  status: string
  /** Override the label. */
  label?: ReactNode
  /** Override the tone. */
  tone?: StatusTone
  /** Extra or replacement statuses, merged over the standard document statuses. */
  statusMap?: Record<string, StatusDefinition>
  variant?: 'subtle' | 'solid' | 'outline'
  size?: Size
}

function humanize(key: string) {
  const text = key.replace(/[-_]+/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Maps a status key to a colored label. Always shows text, so color is never the only cue. */
export function StatusBadge({
  status,
  label,
  tone,
  statusMap,
  variant = 'subtle',
  size = 'md',
  className,
  ...props
}: StatusBadgeProps) {
  const definition = statusMap?.[status] ?? documentStatuses[status]
  return (
    <span
      className={cx('erp-status-badge', className)}
      data-tone={tone ?? definition?.tone ?? 'neutral'}
      data-variant={variant}
      data-size={size}
      data-status={status}
      {...props}
    >
      <span
        className='erp-status-badge__dot'
        aria-hidden='true'
      />
      {label ?? definition?.label ?? humanize(status)}
    </span>
  )
}
