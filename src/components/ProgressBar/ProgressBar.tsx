import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatNumber } from '../../utils/number'
import type { Size } from '../../utils/types'
import { useLocale } from '../LocaleProvider'
import './ProgressBar.css'

export interface ProgressBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Current value. Omit for an indeterminate bar. */
  value?: number
  max?: number
  /** Visible label above the bar (also the accessible name). */
  label?: ReactNode
  /** Shows the percentage (or `valueText`) next to the label. */
  showValue?: boolean
  /** Text read and shown instead of the percentage, e.g. "3 of 12 files". */
  valueText?: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  size?: Size
}

/** Progress of an import, posting run or upload. Indeterminate when `value` is omitted. */
export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  valueText,
  tone = 'primary',
  size = 'md',
  className,
  ...props
}: ProgressBarProps) {
  const { locale } = useLocale()
  const indeterminate = value === undefined
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  const shown = valueText ?? `${formatNumber(Math.round(pct), locale)} %`

  return (
    <div
      className={cx('erp-progress', className)}
      data-tone={tone}
      data-size={size}
      data-indeterminate={flag(indeterminate)}
    >
      {(label != null || (showValue && !indeterminate)) && (
        <div className='erp-progress__header'>
          {label != null && <span className='erp-progress__label'>{label}</span>}
          {showValue && !indeterminate && <span className='erp-progress__value'>{shown}</span>}
        </div>
      )}
      <div
        role='progressbar'
        aria-label={typeof label === 'string' ? label : props['aria-label']}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={indeterminate ? 'Loading' : shown}
        className='erp-progress__track'
        {...props}
      >
        <div
          className='erp-progress__bar'
          style={indeterminate ? undefined : { width: `${String(pct)}%` }}
        />
      </div>
    </div>
  )
}
