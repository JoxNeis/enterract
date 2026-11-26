import { useId, useRef, useState, type ChangeEvent } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { useParsedText } from '../../internal/useParsedText'
import { cx } from '../../utils/cx'
import { formatTime, parseTimeText } from '../../utils/date'
import type { FieldProps, Option, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { getOptionId, Listbox, nextActiveIndex } from '../Listbox'
import { useLocale } from '../LocaleProvider'
import { Popover } from '../Popover'
import { timeOptions } from './timeOptions'
import './TimePicker.css'

export interface TimePickerProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement> | undefined>, NativeInputProps {
  /** Minutes between suggested times. */
  step?: number
  /** Earliest time, `HH:mm`. */
  min?: string
  /** Latest time, `HH:mm`. */
  max?: string
  locale?: string
}

/**
 * Time of day as `HH:mm`. Type `14:30`, `2:30 pm` or `1430`, or pick from the list.
 * Shown in the locale's 12- or 24-hour format.
 */
export function TimePicker(props: TimePickerProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, step = 30, min, max, locale: localeProp, onKeyDown, onFocus, onBlur, placeholder, ...native } =
    rest
  const { locale } = useLocale(localeProp)
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const shellRef = useRef<HTMLDivElement>(null)
  const listId = `${useId()}-times`
  const editable = !field.disabled && !field.readOnly

  const text = useParsedText<string>({
    value: current,
    setValue: setCurrent,
    parse: (raw) => {
      const r = parseTimeText(raw)
      return r.ok ? r : { ok: false, message: 'Enter a time like 14:30' }
    },
    formatDisplay: (v) => formatTime(v, locale),
    formatEdit: (v) => formatTime(v, locale),
    onFocus,
    onBlur: (event) => {
      setOpen(false)
      onBlur?.(event)
    },
  })

  const options: Option[] = timeOptions(step, min, max).map((t) => ({ key: t, label: formatTime(t, locale) }))
  const rangeError =
    current && ((min && current < min) || (max && current > max))
      ? `Choose a time between ${formatTime(min ?? '00:00', locale)} and ${formatTime(max ?? '23:59', locale)}`
      : null

  const openList = () => {
    if (!editable) return
    const index = current ? options.findIndex((o) => o.key >= current) : options.findIndex((o) => o.key >= '08:00')
    setActive(Math.max(0, index))
    setOpen(true)
  }

  return (
    <FormField
      {...field}
      error={field.error ?? text.parseError ?? rangeError}
      className={cx('erp-time-picker', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={shellRef}
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={<Icon name='clock' />}
          >
            <input
              type='text'
              role='combobox'
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete='none'
              aria-activedescendant={open && active >= 0 ? getOptionId(listId, active) : undefined}
              autoComplete='off'
              className='erp-input-shell__input'
              placeholder={placeholder ?? formatTime('09:00', locale)}
              disabled={field.disabled}
              readOnly={field.readOnly}
              required={field.required}
              {...f.controlProps}
              {...native}
              {...text.inputProps}
              onClick={openList}
              onKeyDown={(event) => {
                onKeyDown?.(event)
                if (event.defaultPrevented || !editable) return
                if (!open) {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    openList()
                  }
                  return
                }
                const next = nextActiveIndex(options, active, event.key)
                if (next !== null && event.key !== 'Home' && event.key !== 'End') {
                  event.preventDefault()
                  setActive(next)
                } else if (event.key === 'Enter' && options[active]) {
                  event.preventDefault()
                  text.setFromValue(options[active].key)
                  setOpen(false)
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                }
              }}
            />
          </InputShell>
          <Popover
            open={open}
            anchorRef={shellRef}
            matchAnchorWidth
            className='erp-time-picker__popover'
            onClose={() => {
              setOpen(false)
            }}
          >
            <Listbox
              id={listId}
              options={options}
              selected={current ? [current] : []}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={(o) => {
                text.setFromValue(o.key)
                setOpen(false)
              }}
              aria-labelledby={field.label != null ? f.labelId : undefined}
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
