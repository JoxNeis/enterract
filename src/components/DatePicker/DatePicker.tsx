import { useRef, useState, type ChangeEvent } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { useParsedText } from '../../internal/useParsedText'
import { cx } from '../../utils/cx'
import { datePlaceholder, formatDate, isBetween, parseDateText } from '../../utils/date'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Calendar } from '../Calendar'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Popover } from '../Popover'
import '../../styles/base.css'
import './DatePicker.css'

export interface DatePickerProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement> | undefined>, NativeInputProps {
  /** Earliest allowed date (ISO). */
  min?: string
  /** Latest allowed date (ISO). */
  max?: string
  /** Disable specific dates, e.g. weekends or closed periods. */
  isDateDisabled?: (date: string) => boolean
  locale?: string
  /** Fixed "today" for stories and tests. */
  today?: string
  weekStartsOn?: number
  /** Display format at rest. Defaults to the locale's short date. */
  displayFormat?: Intl.DateTimeFormatOptions
}

/**
 * Date input: type a date in the locale's format (or ISO) or pick it from the calendar.
 * The value is an ISO date string (`2026-03-15`). Alt+ArrowDown opens the calendar.
 */
export function DatePicker(props: DatePickerProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    min,
    max,
    isDateDisabled,
    locale: localeProp,
    today,
    weekStartsOn,
    displayFormat,
    placeholder,
    onKeyDown,
    onFocus,
    onBlur,
    ref,
    ...native
  } = rest
  const { locale } = useLocale(localeProp)
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [open, setOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editable = !field.disabled && !field.readOnly

  const text = useParsedText<string>({
    value: current,
    setValue: setCurrent,
    parse: (raw) => {
      const result = parseDateText(raw, locale)
      return result.ok ? result : { ok: false, message: `Enter a date as ${datePlaceholder(locale)}` }
    },
    formatDisplay: (v) => formatDate(v, locale, displayFormat),
    formatEdit: (v) => formatDate(v, locale),
    onFocus,
    onBlur,
  })

  const rangeError =
    current === null
      ? null
      : !isBetween(current, min, max)
        ? min && current < min
          ? `Date must be on or after ${formatDate(min, locale)}`
          : `Date must be on or before ${formatDate(max, locale)}`
        : isDateDisabled?.(current)
          ? 'This date is not available'
          : null

  const close = () => {
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <FormField
      {...field}
      error={field.error ?? text.parseError ?? rangeError}
      className={cx('erp-date-picker', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={shellRef}
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={
              editable ? (
                <button
                  type='button'
                  className='erp-input-action'
                  aria-label='Choose date'
                  aria-haspopup='dialog'
                  aria-expanded={open}
                  tabIndex={-1}
                  onClick={() => {
                    setOpen((o) => !o)
                  }}
                >
                  <Icon name='calendar' />
                </button>
              ) : (
                <Icon name='calendar' />
              )
            }
          >
            <input
              ref={(node) => {
                inputRef.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
              }}
              type='text'
              autoComplete='off'
              className='erp-input-shell__input'
              placeholder={placeholder ?? datePlaceholder(locale)}
              disabled={field.disabled}
              readOnly={field.readOnly}
              required={field.required}
              {...f.controlProps}
              {...native}
              {...text.inputProps}
              onKeyDown={(event) => {
                onKeyDown?.(event)
                if (event.defaultPrevented || !editable) return
                if (event.key === 'ArrowDown' && event.altKey) {
                  event.preventDefault()
                  setOpen(true)
                }
              }}
            />
          </InputShell>
          <Popover
            open={open}
            anchorRef={shellRef}
            placement='bottom-end'
            role='dialog'
            aria-label='Choose date'
            onClose={(reason) => {
              if (reason === 'escape') close()
              else setOpen(false)
            }}
          >
            <Calendar
              value={current}
              onChange={(iso) => {
                text.setFromValue(iso)
                close()
              }}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              locale={locale}
              today={today}
              weekStartsOn={weekStartsOn}
              autoFocus
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
