import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import './Label.css'
import { flag } from '../../utils/flag'

export interface LabelProps extends ComponentProps<'label'> {
  /** Shows the required marker. The control itself sets aria-required. */
  required?: boolean
  /** Renders a `<span>` instead of `<label>`, for group labels referenced with aria-labelledby. */
  asSpan?: boolean
  size?: Size
  /** Dimmed style for disabled controls. */
  disabled?: boolean
}

/** Text label for a form control, with an optional required marker. */
export function Label({ required, asSpan, size = 'md', disabled, className, children, ...props }: LabelProps) {
  const content = (
    <>
      {children}
      {required && (
        <span
          className='erp-label__required'
          aria-hidden='true'
        >
          *
        </span>
      )}
    </>
  )
  const shared = {
    className: cx('erp-label', className),
    'data-size': size,
    'data-disabled': flag(disabled),
  }
  if (asSpan) {
    const { id, style, title } = props
    return (
      <span
        {...shared}
        id={id}
        style={style}
        title={title}
      >
        {content}
      </span>
    )
  }
  return (
    <label
      {...shared}
      {...props}
    >
      {content}
    </label>
  )
}
