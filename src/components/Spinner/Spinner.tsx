import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import '../../styles/base.css'
import './Spinner.css'

export interface SpinnerProps extends ComponentProps<'span'> {
  /** `sm` 1em (inline), `md` 1.5rem, `lg` 2.5rem. */
  size?: 'sm' | 'md' | 'lg'
  /** Announced text. Pass `null` when the parent already sets aria-busy and announces loading. */
  label?: string | null
}

/** Loading indicator. Announces "Loading" politely unless `label={null}`. */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      className={cx('erp-spinner', className)}
      data-size={size}
      role={label ? 'status' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <span className='erp-spinner__ring' />
    </span>
  )
}
