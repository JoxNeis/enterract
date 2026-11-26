import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { Spinner } from '../Spinner'
import './Button.css'
import { flag } from '../../utils/flag'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export interface ButtonProps extends ComponentProps<'button'> {
  /** Visual weight. Use one `primary` per form section; `danger` for Delete, Reject and Cancel-document. */
  variant?: ButtonVariant
  /** `sm` for grids, toolbars and dense forms. */
  size?: Size
  /** Shows a spinner, sets aria-busy and ignores clicks so an async save can't run twice. */
  loading?: boolean
  /** Leading icon. */
  icon?: ReactNode
  /** Trailing icon, e.g. a chevron on a menu trigger. */
  iconEnd?: ReactNode
  /** Stretch to the container width. */
  fullWidth?: boolean
}

/** Triggers an action. Defaults to `type="button"` so it never submits a form by accident. */
export function Button({
  className,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconEnd,
  fullWidth = false,
  onClick,
  children,
  'aria-disabled': ariaDisabled,
  ...props
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    // `type` defaults to "button" so it never submits a surrounding form by accident
    <button
      type={type}
      className={cx('erp-button', className)}
      data-variant={variant}
      data-size={size}
      data-loading={flag(loading)}
      data-full-width={flag(fullWidth)}
      aria-busy={flag(loading)}
      aria-disabled={flag(loading || ariaDisabled)}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <Spinner
          size='sm'
          label={null}
        />
      ) : (
        icon && <span className='erp-button__icon'>{icon}</span>
      )}
      {children != null && <span className='erp-button__label'>{children}</span>}
      {iconEnd && <span className='erp-button__icon'>{iconEnd}</span>}
    </button>
  )
}
