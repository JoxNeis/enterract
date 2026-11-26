import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { ValueDisplay, type ValueType } from '../ValueDisplay'
import './SummaryCard.css'

export interface SummaryItem {
  label: string
  value: unknown
  type?: ValueType
  currency?: string
  /** Emphasize (e.g. the grand total). */
  emphasis?: boolean
}

export interface SummaryCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: ReactNode
  /** Rows of label/value pairs. */
  items: readonly SummaryItem[]
  /** Optional icon or status next to the title. */
  adornment?: ReactNode
  /** A link or button at the bottom. */
  footer?: ReactNode
}

/** Compact card with a few labelled figures, e.g. customer balance or order totals. */
export function SummaryCard({ title, items, adornment, footer, className, ...props }: SummaryCardProps) {
  return (
    <section
      className={cx('erp-summary-card', className)}
      aria-label={typeof title === 'string' ? title : undefined}
      {...props}
    >
      <header className='erp-summary-card__header'>
        <h3 className='erp-summary-card__title'>{title}</h3>
        {adornment}
      </header>
      <div className='erp-summary-card__items'>
        {items.map((item) => (
          <ValueDisplay
            key={item.label}
            label={item.label}
            value={item.value}
            type={item.type}
            currency={item.currency}
            layout='horizontal'
            data-emphasis={item.emphasis ? true : undefined}
          />
        ))}
      </div>
      {footer && <footer className='erp-summary-card__footer'>{footer}</footer>}
    </section>
  )
}
