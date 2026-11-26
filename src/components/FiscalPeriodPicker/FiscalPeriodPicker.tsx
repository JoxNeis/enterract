import { useRef, useState } from 'react'
import { PeriodGrid } from '../../internal/PeriodGrid'
import { PickerTrigger } from '../../internal/PickerTrigger'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { formatDate } from '../../utils/date'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Popover } from '../Popover'
import { findPeriod, type FiscalCalendar, type FiscalPeriod } from './fiscalCalendar'
import '../MonthPicker/MonthPicker.css'

export interface FiscalPeriodPickerProps extends FieldProps, NativeDivProps {
  /** Fiscal years and periods, from configuration. `buildFiscalCalendar()` makes a monthly one. */
  calendar: FiscalCalendar
  /** Period key, e.g. `FY2026-P01`. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (key: string | null, period: FiscalPeriod | null) => void
  /** Let users pick closed periods (reporting) instead of disabling them (posting). */
  allowClosed?: boolean
  /** Year shown when nothing is selected. Defaults to the last year. */
  defaultYear?: string
  locale?: string
  placeholder?: string
}

/** Fiscal period from a configured fiscal calendar (not the Gregorian calendar). Closed periods are marked. */
export function FiscalPeriodPicker(props: FiscalPeriodPickerProps) {
  const [field, rest] = useFieldProps(props)
  const { calendar, value, defaultValue = null, onChange, allowClosed = false, defaultYear, locale: localeProp, placeholder = 'Select period', ...native } =
    rest
  const { locale } = useLocale(localeProp)
  const [current, setCurrent] = useControllableState<string | null, FiscalPeriod | null>({
    value,
    defaultValue,
    onChange: onChange ? (key, period) => { onChange(key, period ?? null) } : undefined,
  })
  const found = current ? findPeriod(calendar, current) : undefined
  const initialYear = found?.year.key ?? defaultYear ?? calendar.years[calendar.years.length - 1]?.key ?? ''
  const [yearKey, setYearKey] = useState(initialYear)
  const [focused, setFocused] = useState(current ?? '')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  const yearIndex = calendar.years.findIndex((y) => y.key === yearKey)
  const year = calendar.years[yearIndex]
  const cells =
    year?.periods.map((p) => ({
      key: p.key,
      label: p.label.split(' · ')[0] ?? p.label,
      note: p.closed ? 'Closed' : (p.label.split(' · ')[1] ?? ''),
      ariaLabel: `${p.label}, ${formatDate(p.from, locale)} to ${formatDate(p.to, locale)}${p.closed ? ', closed' : ''}`,
      disabled: p.closed && !allowClosed,
    })) ?? []

  const page = (dir: -1 | 1) => {
    const next = calendar.years[yearIndex + dir]
    if (!next) return
    setYearKey(next.key)
    setFocused(next.periods[0]?.key ?? '')
  }

  return (
    <FormField
      {...field}
      helpText={field.helpText ?? (found ? `${formatDate(found.period.from, locale)} – ${formatDate(found.period.to, locale)}` : undefined)}
      warning={field.warning ?? (found?.period.closed ? 'This period is closed' : undefined)}
      className={cx('erp-fiscal-period-picker', field.className)}
    >
      {(f) => (
        <div {...native}>
          <PickerTrigger
            ref={triggerRef}
            controlProps={f.controlProps}
            labelId={field.label != null ? f.labelId : undefined}
            open={open}
            onToggle={() => {
              setYearKey(found?.year.key ?? initialYear)
              setFocused(current ?? calendar.years.find((y) => y.key === initialYear)?.periods[0]?.key ?? '')
              setOpen((o) => !o)
            }}
            text={found ? `${found.year.label} · ${found.period.label}` : null}
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
            aria-label='Choose fiscal period'
            onClose={(reason) => {
              setOpen(false)
              if (reason === 'escape') triggerRef.current?.focus()
            }}
          >
            <div className='erp-month-picker__header'>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Previous fiscal year'
                disabled={yearIndex <= 0}
                onClick={() => {
                  page(-1)
                }}
              >
                <Icon name='chevron-left' />
              </button>
              <span aria-live='polite'>{year?.label}</span>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Next fiscal year'
                disabled={yearIndex >= calendar.years.length - 1}
                onClick={() => {
                  page(1)
                }}
              >
                <Icon name='chevron-right' />
              </button>
            </div>
            <PeriodGrid
              label={`Periods of ${year?.label ?? ''}`}
              cells={cells}
              columns={4}
              selected={current}
              focused={cells.some((c) => c.key === focused) ? focused : (cells[0]?.key ?? '')}
              onFocusChange={setFocused}
              onPage={page}
              autoFocus
              onSelect={(key) => {
                setCurrent(key, findPeriod(calendar, key)?.period ?? null)
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
