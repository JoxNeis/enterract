import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { Icon } from '../Icon'
import './Tag.css'

export interface TagProps extends ComponentProps<'span'> {
  /** Shows a remove button. */
  onRemove?: () => void
  /** Accessible name of the remove button. Defaults to `Remove <text>`. */
  removeLabel?: string
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'
  size?: Size
  disabled?: boolean
}

/** Chip for a value, category or filter. Removable with its button (or Delete/Backspace when focused). */
export function Tag({
  onRemove,
  removeLabel,
  tone = 'neutral',
  size = 'md',
  disabled = false,
  className,
  children,
  ...props
}: TagProps) {
  const label = removeLabel ?? `Remove ${typeof children === 'string' ? children : 'tag'}`
  return (
    <span
      className={cx('erp-tag', className)}
      data-tone={tone}
      data-size={size}
      data-disabled={disabled || undefined}
      {...props}
    >
      <span className='erp-tag__label'>{children}</span>
      {onRemove && !disabled && (
        <button
          type='button'
          className='erp-tag__remove'
          aria-label={label}
          onClick={onRemove}
          onKeyDown={(event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
              event.preventDefault()
              onRemove()
            }
          }}
        >
          <Icon name='close' />
        </button>
      )}
    </span>
  )
}
