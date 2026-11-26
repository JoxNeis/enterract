import { useState, type KeyboardEvent } from 'react'
import { InputShell } from '../../internal/InputShell'
import { cx } from '../../utils/cx'
import { formatNumber, formatNumberForEdit, roundTo } from '../../utils/number'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import type { NumberFieldProps } from '../NumberField'
import { evaluateExpression } from './expression'

export type CalculatorFieldProps = Omit<NumberFieldProps, 'showStepper' | 'step' | 'messages' | 'prefix'>

/**
 * Number input that also accepts arithmetic: type `=12*3.5` (or just `12*3.5`) and press Enter
 * or leave the field. Uses a safe parser, never `eval`.
 */
export function CalculatorField(props: CalculatorFieldProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    precision,
    min,
    max,
    locale: localeProp,
    formatOptions,
    align = 'end',
    suffix,
    onKeyDown,
    onBlur,
    onFocus,
    ...native
  } = rest
  const { locale } = useLocale(localeProp)
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const evaluate = () => {
    if (text === null) return
    const source = text.trim().replace(/^=/, '')
    if (source === '') {
      setCurrent(null)
      setText(null)
      setError(null)
      return
    }
    const result = evaluateExpression(source, locale)
    if (result === null) {
      setError('Enter a number or a calculation like =12*3.5')
      return
    }
    setCurrent(precision === undefined ? result : roundTo(result, precision))
    setText(null)
    setError(null)
  }

  const shown = text ?? (current === null ? '' : formatNumber(current, locale, { maximumFractionDigits: precision, ...formatOptions }))
  const rangeError =
    current !== null && min !== undefined && current < min
      ? `Must be at least ${String(min)}`
      : current !== null && max !== undefined && current > max
        ? `Must be at most ${String(max)}`
        : null

  return (
    <FormField
      {...field}
      error={field.error ?? error ?? rangeError}
      helpText={field.helpText ?? 'You can type a calculation, e.g. =12*3.5'}
      className={cx('erp-calculator-field', field.className)}
    >
      {(f) => (
        <InputShell
          size={field.size}
          invalid={f.invalid}
          disabled={field.disabled}
          readOnly={field.readOnly}
          prefix={<Icon name='calculator' />}
          suffix={suffix}
        >
          <input
            type='text'
            inputMode='decimal'
            autoComplete='off'
            className='erp-input-shell__input'
            data-align={align}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            {...f.controlProps}
            {...native}
            value={shown}
            onFocus={(event) => {
              if (text === null) setText(current === null ? '' : formatNumberForEdit(current, locale))
              onFocus?.(event)
            }}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
            onBlur={(event) => {
              evaluate()
              onBlur?.(event)
            }}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              onKeyDown?.(event)
              if (event.key === 'Enter' && text !== null && /[-+*/()x×÷]/.test(text.replace(/^-/, ''))) {
                event.preventDefault()
                evaluate()
              }
            }}
          />
        </InputShell>
      )}
    </FormField>
  )
}
