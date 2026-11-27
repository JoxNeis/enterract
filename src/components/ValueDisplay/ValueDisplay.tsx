import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { formatDate } from '../../utils/date'
import { formatDecimal } from '../../utils/decimal'
import { flag } from '../../utils/flag'
import { formatDateTime } from '../../utils/format'
import { formatNumber } from '../../utils/number'
import { toText } from '../../utils/text'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Tooltip } from '../Tooltip'
import '../../styles/base.css'
import './ValueDisplay.css'

export type ValueType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'boolean'

export interface ValueDisplayProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: ReactNode
  value: unknown
  /** How to format the value. */
  type?: ValueType
  /** Currency code for `currency` (defaults to the LocaleProvider currency). */
  currency?: string
  /** Decimal places for `number` and `percent`. */
  precision?: number
  /** Percent values are fractions (0.15 = 15 %) unless this is `percent`. */
  percentMode?: 'fraction' | 'percent'
  /** Marks a computed value (e.g. "Qty × Price"). The text is shown as a tooltip. */
  calculated?: boolean | string
  /** Shown for null, undefined and empty values. */
  emptyText?: ReactNode
  /** `horizontal` puts the label on the left (detail panels). */
  layout?: 'vertical' | 'horizontal'
  /** Custom rendering of the formatted value (e.g. a link). */
  render?: (formatted: string) => ReactNode
}

/** Read-only labelled value, formatted by type (currency, date, percent…). */
export function ValueDisplay({
  label,
  value,
  type = 'text',
  currency: currencyProp,
  precision,
  percentMode = 'fraction',
  calculated = false,
  emptyText = '—',
  layout = 'vertical',
  render,
  className,
  ...props
}: ValueDisplayProps) {
  const { locale, currency, timeZone } = useLocale()
  const labelId = useId()
  const empty = value === null || value === undefined || value === ''

  let text = ''
  if (!empty) {
    switch (type) {
      case 'number':
        text = formatNumber(Number(value), locale, { maximumFractionDigits: precision, minimumFractionDigits: precision })
        break
      case 'currency':
        text = formatDecimal(toText(value), locale, { currency: currencyProp ?? currency })
        break
      case 'percent': {
        const pct = percentMode === 'fraction' ? Number(value) * 100 : Number(value)
        text = `${formatNumber(pct, locale, { maximumFractionDigits: precision ?? 2 })} %`
        break
      }
      case 'date':
        text = formatDate(toText(value), locale, { dateStyle: 'medium' })
        break
      case 'datetime':
        text = formatDateTime(toText(value), locale, timeZone)
        break
      case 'boolean':
        text = value === true ? 'Yes' : 'No'
        break
      default:
        text = toText(value)
    }
  }

  const marker = calculated ? (
    <Tooltip content={typeof calculated === 'string' ? calculated : 'Calculated value'}>
      <span
        className='erp-value-display__calc'
        tabIndex={0}
        aria-label={typeof calculated === 'string' ? `Calculated: ${calculated}` : 'Calculated'}
        role='img'
      >
        <Icon name='calculator' />
      </span>
    </Tooltip>
  ) : null

  return (
    <div
      className={cx('erp-value-display', className)}
      data-layout={layout}
      data-type={type}
      data-empty={flag(empty)}
      role='group'
      aria-labelledby={labelId}
      {...props}
    >
      <span
        id={labelId}
        className='erp-value-display__label'
      >
        {label}
        {marker}
      </span>
      <span className='erp-value-display__value'>{empty ? emptyText : render ? render(text) : text}</span>
    </div>
  )
}
