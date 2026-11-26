import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { isoToZoned, zonedToISO } from '../../utils/date'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { DatePicker } from '../DatePicker'
import { FieldDefaultsProvider, FormField, useFieldProps } from '../FormField'
import { useLocale } from '../LocaleProvider'
import { TimePicker } from '../TimePicker'
import './DateTimePicker.css'

export interface DateTimePickerProps extends FieldProps, NativeDivProps {
  /** ISO 8601 instant with offset, e.g. `2026-03-15T09:30:00+07:00`. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  /**
   * IANA time zone the user enters the time in. Defaults to the LocaleProvider time zone. Always
   * explicit: the same instant shows differently in Jakarta and Berlin.
   */
  timeZone?: string
  /** Shows the time zone next to the inputs. */
  showTimeZone?: boolean
  /** Minutes between suggested times. */
  step?: number
  /** Time used when only a date is entered. */
  defaultTime?: string
  locale?: string
  today?: string
}

function zoneName(timeZone: string, locale: string, iso: string | null) {
  const date = iso ? new Date(Date.parse(iso)) : new Date(Date.UTC(2026, 0, 15))
  return (
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  )
}

/** Date and time in an explicit time zone. The value is an ISO 8601 instant with offset. */
export function DateTimePicker(props: DateTimePickerProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    timeZone: tzProp,
    showTimeZone = true,
    step = 30,
    defaultTime = '09:00',
    locale: localeProp,
    today,
    ...native
  } = rest
  const settings = useLocale(localeProp)
  const timeZone = tzProp ?? settings.timeZone
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const parts = current ? isoToZoned(current, timeZone) : null
  const label = typeof field.label === 'string' ? field.label : 'Date and time'

  const update = (date: string | null, time: string | null) => {
    if (!date) {
      setCurrent(null)
      return
    }
    setCurrent(zonedToISO(date, time ?? defaultTime, timeZone))
  }

  return (
    <FormField
      {...field}
      group
      className={cx('erp-date-time-picker', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          className='erp-date-time-picker__inputs'
          {...native}
        >
          <FieldDefaultsProvider
            size={field.size}
            disabled={field.disabled}
            readOnly={field.readOnly}
          >
            <DatePicker
              label={`${label} date`}
              hideLabel
              invalid={f.invalid}
              locale={settings.locale}
              today={today}
              value={parts?.date ?? null}
              onChange={(date) => {
                update(date, parts?.time ?? null)
              }}
            />
            <TimePicker
              label={`${label} time`}
              hideLabel
              invalid={f.invalid}
              step={step}
              locale={settings.locale}
              value={parts?.time ?? null}
              onChange={(time) => {
                if (parts?.date) update(parts.date, time)
              }}
            />
          </FieldDefaultsProvider>
          {showTimeZone && (
            <span
              className='erp-date-time-picker__zone'
              title={timeZone}
            >
              {zoneName(timeZone, settings.locale, current)}
            </span>
          )}
        </div>
      )}
    </FormField>
  )
}
