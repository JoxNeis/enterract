import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './DrillLink.css'

export interface DrillLinkProps extends Omit<ComponentProps<'button'>, 'onClick'> {
  /** The figure shown (already formatted), e.g. `$12,400`. */
  children: ReactNode
  /** What the user drills into, for the accessible name: "View details for Overdue invoices". */
  target: string
  /** Opens the detail (a filtered list, a report). */
  onDrill: () => void
}

/** A number in a report or KPI that opens the records behind it. */
export function DrillLink({ children, target, onDrill, className, ...props }: DrillLinkProps) {
  return (
    <button
      type='button'
      className={cx('erp-drill-link', className)}
      aria-label={`${typeof children === 'string' || typeof children === 'number' ? `${String(children)}, ` : ''}view details for ${target}`}
      onClick={onDrill}
      {...props}
    >
      <span className='erp-drill-link__value'>{children}</span>
      <Icon
        name='zoom'
        className='erp-drill-link__icon'
      />
    </button>
  )
}
