import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../utils/cx'
import type { Size } from '../utils/types'
import '../styles/base.css'
import { flag } from '../utils/flag'

export interface InputShellProps extends Omit<ComponentProps<'div'>, 'prefix'> {
  size?: Size | undefined
  invalid?: boolean | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  prefix?: ReactNode
  suffix?: ReactNode
}

/** Bordered box around an input with optional leading/trailing adornments. Internal. */
export function InputShell({
  size = 'md',
  invalid,
  disabled,
  readOnly,
  prefix,
  suffix,
  className,
  children,
  ...props
}: InputShellProps) {
  return (
    <div
      className={cx('erp-input-shell', className)}
      data-size={size}
      data-invalid={flag(invalid)}
      data-disabled={flag(disabled)}
      data-readonly={flag(readOnly)}
      {...props}
    >
      {prefix != null && <span className='erp-input-shell__adornment'>{prefix}</span>}
      {children}
      {suffix != null && <span className='erp-input-shell__adornment'>{suffix}</span>}
    </div>
  )
}
