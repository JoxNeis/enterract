import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { compareDecimal } from '../../utils/decimal'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { CurrencyField } from '../CurrencyField'
import { DatePicker } from '../DatePicker'
import { FieldDefaultsProvider, FormField, useFieldProps } from '../FormField'
import { NumberField } from '../NumberField'
import '../../styles/base.css'
import './RangeFilter.css'

export interface RangeValue<T> {
  from: T | null
  to: T | null
}

interface BaseProps extends Omit<FieldProps, 'name'>, Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | keyof FieldProps> {
  locale?: string
  /** Labels of the two inputs for screen readers. */
  fromLabel?: string
  toLabel?: string
}

export interface NumberRangeFilterProps extends BaseProps {
  type: 'number'
  value?: RangeValue<number> | null
  defaultValue?: RangeValue<number> | null
  onChange?: (value: RangeValue<number>) => void
  precision?: number
}

export interface DateRangeFilterProps extends BaseProps {
  type: 'date'
  value?: RangeValue<string> | null
  defaultValue?: RangeValue<string> | null
  onChange?: (value: RangeValue<string>) => void
}

export interface CurrencyRangeFilterProps extends BaseProps {
  type: 'currency'
  value?: RangeValue<string> | null
  defaultValue?: RangeValue<string> | null
  onChange?: (value: RangeValue<string>) => void
  currency?: string
}

export type RangeFilterProps = NumberRangeFilterProps | DateRangeFilterProps | CurrencyRangeFilterProps

const EMPTY = { from: null, to: null }

/** From–to filter for numbers, amounts and dates. Flags a range whose start is after its end. */
export function RangeFilter(props: RangeFilterProps) {
  const [field, rest] = useFieldProps(props)
  const { locale, fromLabel = 'From', toLabel = 'To', ...others } = rest
  const label = typeof field.label === 'string' ? field.label : ''
  const [current, setCurrent] = useControllableState<RangeValue<unknown> | null>({
    value: props.value,
    defaultValue: (props.defaultValue as RangeValue<unknown> | null | undefined) ?? EMPTY,
    onChange: props.onChange as ((v: RangeValue<unknown> | null) => void) | undefined,
  })
  const range = current ?? EMPTY
  const set = (part: 'from' | 'to', v: unknown) => {
    setCurrent({ ...range, [part]: v ?? null })
  }

  const { from, to } = range
  let reversed = false
  if (from !== null && to !== null) {
    if (props.type === 'number') reversed = (from as number) > (to as number)
    else if (props.type === 'currency') reversed = compareDecimal(from as string, to as string) > 0
    else reversed = (from as string) > (to as string)
  }

  const omit = new Set(['type', 'value', 'defaultValue', 'onChange', 'precision', 'currency'])
  const nativeProps = Object.fromEntries(Object.entries(others).filter(([k]) => !omit.has(k)))

  const input = (part: 'from' | 'to') => {
    const common = {
      label: `${label} ${part === 'from' ? fromLabel : toLabel}`.trim(),
      hideLabel: true,
      locale,
      invalid: reversed,
      placeholder: part === 'from' ? fromLabel : toLabel,
    }
    if (props.type === 'number')
      return (
        <NumberField
          {...common}
          precision={props.precision}
          value={range[part] as number | null}
          onChange={(v) => {
            set(part, v)
          }}
        />
      )
    if (props.type === 'currency')
      return (
        <CurrencyField
          {...common}
          currency={props.currency}
          value={range[part] as string | null}
          onChange={(v) => {
            set(part, v)
          }}
        />
      )
    return (
      <DatePicker
        {...common}
        min={part === 'to' ? ((from as string | null) ?? undefined) : undefined}
        value={range[part] as string | null}
        onChange={(v) => {
          set(part, v)
        }}
      />
    )
  }

  return (
    <FormField
      {...field}
      group
      error={field.error ?? (reversed ? 'The start is after the end' : undefined)}
      className={cx('erp-range-filter', field.className)}
    >
      {(f) => (
        <div
          role='group'
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-range-filter__inputs'
          {...(nativeProps)}
        >
          <FieldDefaultsProvider
            size={field.size}
            disabled={field.disabled}
            readOnly={field.readOnly}
          >
            {input('from')}
            <span
              className='erp-range-filter__dash'
              aria-hidden='true'
            >
              –
            </span>
            {input('to')}
          </FieldDefaultsProvider>
        </div>
      )}
    </FormField>
  )
}
