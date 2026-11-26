import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { formatNumber } from '../../utils/number'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import './QuickFilter.css'

export interface QuickFilterOption {
  key: string
  label: string
  /** Number of matching records, shown in the chip. */
  count?: number
}

export interface QuickFilterProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  options: readonly QuickFilterOption[]
  /** Active chip keys. Empty = all. */
  value?: readonly string[]
  defaultValue?: readonly string[]
  onChange?: (keys: string[]) => void
  /** Several chips at once. */
  multiple?: boolean
  /** Label of the reset chip. `false` hides it. */
  allLabel?: string | false
  'aria-label'?: string
}

/** Row of toggle chips above a list (Open · Overdue · Mine). */
export function QuickFilter({
  options,
  value,
  defaultValue = [],
  onChange,
  multiple = false,
  allLabel = 'All',
  className,
  'aria-label': ariaLabel = 'Quick filters',
  ...props
}: QuickFilterProps) {
  const { locale } = useLocale()
  const [active, setActive] = useControllableState<readonly string[]>({
    value,
    defaultValue,
    onChange: onChange ? (keys) => { onChange([...keys]) } : undefined,
  })

  const toggle = (key: string) => {
    const on = active.includes(key)
    setActive(multiple ? (on ? active.filter((k) => k !== key) : [...active, key]) : on ? [] : [key])
  }

  return (
    <div
      role='group'
      aria-label={ariaLabel}
      className={cx('erp-quick-filter', className)}
      {...props}
    >
      {allLabel !== false && (
        <button
          type='button'
          className='erp-quick-filter__chip'
          aria-pressed={active.length === 0}
          onClick={() => {
            setActive([])
          }}
        >
          {allLabel}
        </button>
      )}
      {options.map((o) => {
        const on = active.includes(o.key)
        return (
          <button
            key={o.key}
            type='button'
            className='erp-quick-filter__chip'
            aria-pressed={on}
            onClick={() => {
              toggle(o.key)
            }}
          >
            {on && multiple && <Icon name='check' />}
            {o.label}
            {o.count !== undefined && <span className='erp-quick-filter__count'>{formatNumber(o.count, locale)}</span>}
          </button>
        )
      })}
    </div>
  )
}
