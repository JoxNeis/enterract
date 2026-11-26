import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../Icon'
import './FieldMessage.css'

export type FieldMessageTone = 'help' | 'error' | 'warning' | 'success'

export interface FieldMessageProps extends ComponentProps<'div'> {
  /** `error` and `warning` show an icon so the meaning does not depend on color. */
  tone?: FieldMessageTone
}

const toneIcon: Partial<Record<FieldMessageTone, IconName>> = {
  error: 'error',
  warning: 'warning',
  success: 'success',
}

/** Help, error or warning text under a control. Link it to the control with aria-describedby. */
export function FieldMessage({ tone = 'help', className, children, ...props }: FieldMessageProps) {
  const icon = toneIcon[tone]
  return (
    <div
      className={cx('erp-field-message', className)}
      data-tone={tone}
      {...props}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </div>
  )
}
