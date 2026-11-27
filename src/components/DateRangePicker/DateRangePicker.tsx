import { useRef, useState } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { datePlaceholder, formatDate, isBetween, parseDateText, todayISO } from '../../utils/date'
import { flag } from '../../utils/flag'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Calendar } from '../Calendar'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { Popover } from '../Popover'
import { defaultRangePresets, type DateRange, type DateRangePreset } from './presets'
import '../../styles/base.css'
import './DateRangePicker.css'

export interface DateRangePickerProps extends FieldProps, NativeDivProps {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onChange?: (value: DateRange) => void
  /** Quick ranges in the popover. `false` hides them. */
  presets?: readonly DateRangePreset[] | false
  min?: string
  max?: string
  locale?: string
  /** Fixed "today" for presets, stories and tests. */
  today?: string
  weekStartsOn?: number
}

const EMPTY: DateRange = { from: null, to: null }

/**
 * Start and end date. Type both dates, or open the two-month calendar and click start and end,
 * or pick a preset (This month, Last quarter…). Value: `{ from, to }` as ISO dates.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = EMPTY, onChange, presets = defaultRangePresets, min, max, locale: localeProp, today: todayProp, weekStartsOn, ...native } =
    rest
  const { locale } = useLocale(localeProp)
  const [fallbackToday] = useState(todayISO)
  const today = todayProp ?? fallbackToday
  const [raw, setRaw] = useControllableState<DateRange | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange(v ?? EMPTY) } : undefined,
  })
  const range = raw ?? EMPTY
  const [open, setOpen] = useState(false)
  const [anchor, setAnchorDate] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [texts, setTexts] = useState<{ from: string | null; to: string | null }>({ from: null, to: null })
  const shellRef = useRef<HTMLDivElement>(null)
  const editable = !field.disabled && !field.readOnly

  const commitText = (part: 'from' | 'to') => {
    const t = texts[part]
    if (t === null) return
    const parsed = parseDateText(t, locale)
    if (parsed.ok) {
      setRaw({ ...range, [part]: parsed.value })
      setTexts((s) => ({ ...s, [part]: null }))
    }
  }

  const invalidText = (part: 'from' | 'to') => {
    const t = texts[part]
    return t !== null && !parseDateText(t, locale).ok
  }
  const reversed = range.from !== null && range.to !== null && range.from > range.to
  const outOfRange = [range.from, range.to].some((d) => d !== null && !isBetween(d, min, max))
  const error =
    invalidText('from') || invalidText('to')
      ? `Enter dates as ${datePlaceholder(locale)}`
      : reversed
        ? 'The start date is after the end date'
        : outOfRange
          ? 'Dates are outside the allowed range'
          : null

  const pickDay = (iso: string | null) => {
    if (!iso) return
    if (anchor === null) {
      setAnchorDate(iso)
      setRaw({ from: iso, to: null })
    } else {
      const [from, to] = iso < anchor ? [iso, anchor] : [anchor, iso]
      setRaw({ from, to })
      setAnchorDate(null)
      setOpen(false)
    }
  }

  const input = (part: 'from' | 'to', labelText: string) => (
    <input
      type='text'
      autoComplete='off'
      className='erp-input-shell__input erp-date-range-picker__input'
      aria-label={labelText}
      aria-invalid={flag(invalidText(part) || reversed)}
      placeholder={datePlaceholder(locale)}
      disabled={field.disabled}
      readOnly={field.readOnly}
      value={texts[part] ?? formatDate(range[part], locale)}
      onChange={(event) => {
        setTexts((s) => ({ ...s, [part]: event.target.value }))
      }}
      onBlur={() => {
        commitText(part)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commitText(part)
        if (event.key === 'ArrowDown' && event.altKey && editable) {
          event.preventDefault()
          setOpen(true)
        }
      }}
    />
  )

  const label = typeof field.label === 'string' ? field.label : 'Date range'

  return (
    <FormField
      {...field}
      group
      error={field.error ?? error}
      className={cx('erp-date-range-picker', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={shellRef}
            role='group'
            aria-labelledby={field.label != null ? f.labelId : undefined}
            aria-describedby={f.describedBy}
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            id={f.id}
            suffix={
              editable ? (
                <button
                  type='button'
                  className='erp-input-action'
                  aria-label='Choose dates'
                  aria-haspopup='dialog'
                  aria-expanded={open}
                  onClick={() => {
                    setAnchorDate(null)
                    setOpen((o) => !o)
                  }}
                >
                  <Icon name='calendar' />
                </button>
              ) : (
                <Icon name='calendar' />
              )
            }
            {...native}
          >
            {input('from', `${label} start`)}
            <span
              aria-hidden='true'
              className='erp-date-range-picker__dash'
            >
              –
            </span>
            {input('to', `${label} end`)}
          </InputShell>
          <Popover
            open={open}
            anchorRef={shellRef}
            placement='bottom-start'
            role='dialog'
            aria-label='Choose dates'
            className='erp-date-range-picker__popover'
            onClose={() => {
              setOpen(false)
              setAnchorDate(null)
            }}
          >
            {presets && presets.length > 0 && (
              <ul
                className='erp-date-range-picker__presets'
                aria-label='Quick ranges'
              >
                {presets.map((p) => (
                  <li key={p.key}>
                    <button
                      type='button'
                      onClick={() => {
                        setRaw(p.range(today))
                        setOpen(false)
                      }}
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Calendar
              value={null}
              onChange={pickDay}
              rangeStart={anchor ?? range.from}
              rangeEnd={anchor ? hover : range.to}
              onDateHover={setHover}
              numberOfMonths={2}
              defaultMonth={range.from ?? today}
              min={min}
              max={max}
              today={today}
              locale={locale}
              weekStartsOn={weekStartsOn}
              autoFocus
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
