import { useRef, useState } from 'react'
import { PeriodGrid } from '../../internal/PeriodGrid'
import { PickerTrigger } from '../../internal/PickerTrigger'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { formatDate, monthNames, todayISO } from '../../utils/date'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Popover } from '../Popover'
import './MonthPicker.css'

export interface MonthPickerProps extends FieldProps, NativeDivProps {
  /** First day of the month, ISO `YYYY-MM-01`. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  /** Earliest month (any date in it). */
  min?: string
  max?: string
  locale?: string
  today?: string
  placeholder?: string
}

/** Month and year, e.g. for reporting periods. The value is the first day: `2026-03-01`. */
export function MonthPicker(props: MonthPickerProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, min, max, locale: localeProp, today: todayProp, placeholder = 'Select month', ...native } = rest
  const { locale } = useLocale(localeProp)
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(Number((current ?? today).slice(0, 4)))
  const [focused, setFocused] = useState((current ?? today).slice(0, 7))
  const triggerRef = useRef<HTMLDivElement>(null)

  const short = monthNames(locale, 'short')
  const long = monthNames(locale, 'long')
  const minMonth = min?.slice(0, 7)
  const maxMonth = max?.slice(0, 7)
  const cells = short.map((name, i) => {
    const key = `${String(year)}-${String(i + 1).padStart(2, '0')}`
    return {
      key,
      label: name,
      ariaLabel: `${long[i] ?? name} ${String(year)}`,
      disabled: (minMonth !== undefined && key < minMonth) || (maxMonth !== undefined && key > maxMonth),
    }
  })

  const toggle = () => {
    const base = current ?? today
    setYear(Number(base.slice(0, 4)))
    setFocused(base.slice(0, 7))
    setOpen((o) => !o)
  }
  const page = (dir: -1 | 1) => {
    setYear((y) => y + dir)
    setFocused((f) => `${String(Number(f.slice(0, 4)) + dir)}${f.slice(4)}`)
  }

  return (
    <FormField
      {...field}
      className={cx('erp-month-picker', field.className)}
    >
      {(f) => (
        <div {...native}>
          <PickerTrigger
            ref={triggerRef}
            controlProps={f.controlProps}
            labelId={field.label != null ? f.labelId : undefined}
            open={open}
            onToggle={toggle}
            text={current ? formatDate(current, locale, { month: 'long', year: 'numeric' }) : null}
            placeholder={placeholder}
            icon='calendar'
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
          />
          <Popover
            open={open}
            anchorRef={triggerRef}
            role='dialog'
            aria-label='Choose month'
            onClose={(reason) => {
              setOpen(false)
              if (reason === 'escape') triggerRef.current?.focus()
            }}
          >
            <div className='erp-month-picker__header'>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Previous year'
                onClick={() => {
                  page(-1)
                }}
              >
                <Icon name='chevron-left' />
              </button>
              <span aria-live='polite'>{year}</span>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Next year'
                onClick={() => {
                  page(1)
                }}
              >
                <Icon name='chevron-right' />
              </button>
            </div>
            <PeriodGrid
              label={`Months of ${String(year)}`}
              cells={cells}
              columns={3}
              selected={current?.slice(0, 7) ?? null}
              focused={focused.startsWith(String(year)) ? focused : (cells[0]?.key ?? focused)}
              onFocusChange={setFocused}
              onPage={page}
              autoFocus
              onSelect={(key) => {
                setCurrent(`${key}-01`)
                setOpen(false)
                triggerRef.current?.focus()
              }}
            />
          </Popover>
        </div>
      )}
    </FormField>
  )
}
