import type { ChangeEvent, ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { useParsedText } from '../../internal/useParsedText'
import { cx } from '../../utils/cx'
import {
  clamp,
  formatNumber,
  formatNumberForEdit,
  normalizeDecimalText,
  roundTo,
  type FormatNumberOptions,
} from '../../utils/number'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { defaultNumberMessages, type NumberFieldMessages } from './messages'
import './NumberField.css'

export interface NumberFieldProps extends FieldProps, ValueProps<number, ChangeEvent<HTMLInputElement>>, NativeInputProps {
  /** Maximum decimal places. `0` makes an integer field. More decimals are rejected, never rounded. */
  precision?: number
  min?: number
  max?: number
  /** Increment for ArrowUp/ArrowDown and the stepper buttons. */
  step?: number
  /** Shows \u2212 / + buttons. */
  showStepper?: boolean
  /** Locale for parsing and formatting. Defaults to the LocaleProvider. */
  locale?: string
  /** Display formatting at rest. `minimumFractionDigits` pads (`2.00`). */
  formatOptions?: FormatNumberOptions
  /** Numeric controls default to `end`. */
  align?: 'start' | 'end'
  prefix?: ReactNode
  suffix?: ReactNode
  /** Override the built-in validation messages (for translation). */
  messages?: Partial<NumberFieldMessages>
}

/**
 * Locale-aware numeric input. Shows `1,234.5` at rest and `1234.5` while editing. Text that is
 * not a number (`12abc`) stays as typed, is marked invalid and emits nothing.
 */
export function NumberField(props: NumberFieldProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    precision,
    min,
    max,
    step = 1,
    showStepper = false,
    locale: localeProp,
    formatOptions,
    align = 'end',
    prefix,
    suffix,
    messages: messagesProp,
    onKeyDown,
    onFocus,
    onBlur,
    ...native
  } = rest
  const { locale } = useLocale(localeProp)
  const messages = { ...defaultNumberMessages, ...messagesProp }
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })

  const numeric = useParsedText<number>({
    value: current,
    setValue: setCurrent,
    parse: (text) => {
      const result = normalizeDecimalText(text, locale)
      if (!result.ok) return { ok: false, message: messages.invalid }
      if (result.value === null) return { ok: true, value: null }
      const decimals = result.value.split('.')[1]?.length ?? 0
      if (precision !== undefined && decimals > precision) return { ok: false, message: messages.precision(precision) }
      return { ok: true, value: Number(result.value) }
    },
    formatDisplay: (v) =>
      formatNumber(v, locale, { maximumFractionDigits: precision, ...formatOptions }),
    formatEdit: (v) => formatNumberForEdit(v, locale),
    onFocus,
    onBlur,
  })

  const fmt = (n: number) => formatNumber(n, locale, { maximumFractionDigits: precision })
  const rangeError =
    current === null
      ? null
      : min !== undefined && current < min
        ? messages.min(fmt(min))
        : max !== undefined && current > max
          ? messages.max(fmt(max))
          : null
  const builtInError = numeric.parseError ?? rangeError
  const editable = !field.disabled && !field.readOnly

  const stepBy = (direction: 1 | -1) => {
    if (!editable) return
    const base = current ?? (min !== undefined && min > 0 ? min - step * direction : 0)
    const next = clamp(roundTo(base + step * direction, Math.max(precision ?? 10, 0)), min, max)
    numeric.setFromValue(next)
  }

  const stepper = showStepper ? (
    <span className='erp-number-field__stepper'>
      <button
        type='button'
        className='erp-input-action'
        aria-label='Decrease'
        tabIndex={-1}
        disabled={!editable || (min !== undefined && current !== null && current <= min)}
        onClick={() => {
          stepBy(-1)
        }}
      >
        <Icon name='minus' />
      </button>
      <button
        type='button'
        className='erp-input-action'
        aria-label='Increase'
        tabIndex={-1}
        disabled={!editable || (max !== undefined && current !== null && current >= max)}
        onClick={() => {
          stepBy(1)
        }}
      >
        <Icon name='add' />
      </button>
    </span>
  ) : null

  return (
    <FormField
      {...field}
      error={field.error ?? builtInError}
      className={cx('erp-number-field', field.className)}
    >
      {(f) => (
        <InputShell
          size={field.size}
          invalid={f.invalid}
          disabled={field.disabled}
          readOnly={field.readOnly}
          prefix={prefix}
          suffix={
            suffix != null || stepper ? (
              <>
                {suffix}
                {stepper}
              </>
            ) : undefined
          }
        >
          <input
            type='text'
            inputMode={precision === 0 ? 'numeric' : 'decimal'}
            autoComplete='off'
            className='erp-input-shell__input'
            data-align={align}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            aria-valuemin={min}
            aria-valuemax={max}
            {...f.controlProps}
            {...native}
            {...numeric.inputProps}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (event.defaultPrevented) return
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault()
                stepBy(event.key === 'ArrowUp' ? 1 : -1)
              }
            }}
          />
        </InputShell>
      )}
    </FormField>
  )
}
