import type { ChangeEvent, ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { useParsedText } from '../../internal/useParsedText'
import { cx } from '../../utils/cx'
import { compareDecimal, currencyDigits, formatDecimal, parseDecimal } from '../../utils/decimal'
import { getSeparators } from '../../utils/number'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { useLocale } from '../LocaleProvider'
import '../../styles/base.css'
import './CurrencyField.css'

export interface CurrencyFieldProps extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement>>, NativeInputProps {
  /** ISO 4217 code. Defaults to the LocaleProvider currency. Controlled when `currencies` is used. */
  currency?: string
  /** Uncontrolled initial currency when `currencies` is given. */
  defaultCurrency?: string
  /** Shows a currency selector with these codes. */
  currencies?: string[]
  onCurrencyChange?: (currency: string) => void
  /** Decimal places. Defaults to the currency's minor units (2 for USD, 0 for JPY). */
  scale?: number
  /** Decimal string bounds. */
  min?: string
  max?: string
  /** Rejects negative amounts. */
  allowNegative?: boolean
  locale?: string
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code'
  /** Numeric controls default to `end`. */
  align?: 'start' | 'end'
  prefix?: ReactNode
}

function currencySymbols(locale: string, currency: string): string[] {
  const symbols = new Set<string>([currency])
  for (const display of ['symbol', 'narrowSymbol'] as const) {
    const part = new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: display })
      .formatToParts(1)
      .find((p) => p.type === 'currency')
    if (part) symbols.add(part.value)
  }
  return [...symbols].sort((a, b) => b.length - a.length)
}

/**
 * Money input. The value is a **decimal string** (`"1234.50"`), never a float. Shows `$1,234.50`
 * at rest and `1234.50` while editing. Pasted text with the currency symbol is accepted.
 */
export function CurrencyField(props: CurrencyFieldProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    currency: currencyProp,
    defaultCurrency,
    currencies,
    onCurrencyChange,
    scale: scaleProp,
    min,
    max,
    allowNegative = true,
    locale: localeProp,
    currencyDisplay = 'symbol',
    align = 'end',
    prefix,
    onFocus,
    onBlur,
    ...native
  } = rest
  const settings = useLocale(localeProp)
  const { locale } = settings
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [currency, setCurrency] = useControllableState({
    value: currencyProp,
    defaultValue: defaultCurrency ?? settings.currency,
    onChange: onCurrencyChange,
  })
  const scale = scaleProp ?? currencyDigits(currency)
  const showSelector = currencies !== undefined && currencies.length > 0

  const numeric = useParsedText<string>({
    value: current,
    setValue: setCurrent,
    parse: (raw) => {
      let text = raw
      for (const symbol of currencySymbols(locale, currency)) text = text.split(symbol).join('')
      const result = parseDecimal(text, locale)
      if (!result.ok) return { ok: false, message: 'Enter a valid amount' }
      if (result.value === null) return { ok: true, value: null }
      if ((result.value.split('.')[1]?.length ?? 0) > scale) {
        return { ok: false, message: scale === 0 ? 'Enter a whole amount' : `Use at most ${String(scale)} decimal places` }
      }
      if (!allowNegative && result.value.startsWith('-')) return { ok: false, message: 'Amount cannot be negative' }
      return { ok: true, value: result.value }
    },
    formatDisplay: (v) =>
      formatDecimal(v, locale, {
        currency: showSelector ? undefined : currency,
        currencyDisplay,
        minimumFractionDigits: scale,
        maximumFractionDigits: scale,
      }),
    formatEdit: (v) => v.replace('.', getSeparators(locale).decimal),
    onFocus,
    onBlur,
  })

  const fmt = (v: string) => formatDecimal(v, locale, { currency, minimumFractionDigits: scale, maximumFractionDigits: scale })
  const rangeError =
    current === null
      ? null
      : min !== undefined && compareDecimal(current, min) < 0
        ? `Must be at least ${fmt(min)}`
        : max !== undefined && compareDecimal(current, max) > 0
          ? `Must be at most ${fmt(max)}`
          : null

  return (
    <FormField
      {...field}
      error={field.error ?? numeric.parseError ?? rangeError}
      className={cx('erp-currency-field', field.className)}
    >
      {(f) => (
        <InputShell
          size={field.size}
          invalid={f.invalid}
          disabled={field.disabled}
          readOnly={field.readOnly}
          prefix={prefix}
          suffix={
            showSelector ? (
              <select
                className='erp-currency-field__select'
                aria-label='Currency'
                value={currency}
                disabled={field.disabled || field.readOnly}
                onChange={(event) => {
                  setCurrency(event.target.value)
                }}
              >
                {currencies.map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        >
          <input
            type='text'
            inputMode='decimal'
            autoComplete='off'
            className='erp-input-shell__input'
            data-align={align}
            data-currency={currency}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            {...f.controlProps}
            {...native}
            {...numeric.inputProps}
          />
        </InputShell>
      )}
    </FormField>
  )
}
