import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import '../../styles/base.css'
import './Badge.css'

export interface BadgeProps extends ComponentProps<'span'> {
  /** Number shown. Hidden when 0 unless `showZero`. */
  count?: number
  /** Above this, shows `max+`. */
  max?: number
  showZero?: boolean
  /** A small dot instead of a number (still needs `aria-label` or nearby text). */
  dot?: boolean
  tone?: 'neutral' | 'primary' | 'danger' | 'success' | 'warning'
}

/** Count badge, e.g. unread items or pending approvals. */
export function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  tone = 'primary',
  className,
  children,
  ...props
}: BadgeProps) {
  if (!dot && children == null && (count === undefined || (count === 0 && !showZero))) return null
  const text = dot ? null : (children ?? (count !== undefined && count > max ? `${String(max)}+` : String(count)))
  return (
    <span
      className={cx('erp-badge', className)}
      data-tone={tone}
      data-dot={dot || undefined}
      {...props}
    >
      {text}
    </span>
  )
}
