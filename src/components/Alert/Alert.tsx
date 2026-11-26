import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { focusField } from '../../utils/focus'
import { Icon, type IconName } from '../Icon'
import './Alert.css'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

export interface AlertFieldError {
  /** id of the field to focus when the link is clicked. */
  fieldId: string
  /** Field name shown before the message. */
  label?: ReactNode
  message: ReactNode
}

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Meaning. Each tone has an icon, so it never relies on color alone. */
  tone?: AlertTone
  title?: ReactNode
  /** Error banner: a list of field errors that link to their fields. */
  errors?: readonly AlertFieldError[]
  /** Shows a dismiss button. */
  onDismiss?: () => void
  /** Buttons or links on the right. */
  actions?: ReactNode
  /** Replace or hide (`false`) the tone icon. */
  icon?: ReactNode | false
  /**
   * How it is announced. Defaults to `assertive` (role="alert") for errors and `polite`
   * (role="status") otherwise. Use `off` for static page content.
   */
  live?: 'assertive' | 'polite' | 'off'
}

const toneIcon: Record<AlertTone, IconName> = { info: 'info', success: 'success', warning: 'warning', error: 'error' }

/**
 * Inline message: error banner, warning, success or info. As an error banner it lists the form
 * errors with links that move focus to each field.
 */
export function Alert({
  tone = 'info',
  title,
  errors,
  onDismiss,
  actions,
  icon,
  live,
  className,
  children,
  ...props
}: AlertProps) {
  const politeness = live ?? (tone === 'error' ? 'assertive' : 'polite')
  const role = politeness === 'assertive' ? 'alert' : politeness === 'polite' ? 'status' : undefined

  return (
    <div
      role={role}
      className={cx('erp-alert', className)}
      data-tone={tone}
      {...props}
    >
      {icon !== false && <span className='erp-alert__icon'>{icon ?? <Icon name={toneIcon[tone]} />}</span>}
      <div className='erp-alert__body'>
        {title && <div className='erp-alert__title'>{title}</div>}
        {children && <div className='erp-alert__content'>{children}</div>}
        {errors && errors.length > 0 && (
          <ul className='erp-alert__errors'>
            {errors.map((e) => (
              <li key={e.fieldId}>
                <a
                  href={`#${e.fieldId}`}
                  onClick={(event) => {
                    event.preventDefault()
                    focusField(e.fieldId)
                  }}
                >
                  {e.label && <strong>{e.label}: </strong>}
                  {e.message}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {actions && <div className='erp-alert__actions'>{actions}</div>}
      {onDismiss && (
        <button
          type='button'
          className='erp-input-action erp-alert__dismiss'
          aria-label='Dismiss'
          onClick={onDismiss}
        >
          <Icon name='close' />
        </button>
      )}
    </div>
  )
}
