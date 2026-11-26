import { useRef, useState } from 'react'
import { PeriodGrid } from '../../internal/PeriodGrid'
import { PickerTrigger } from '../../internal/PickerTrigger'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { Popover } from '../Popover'
import '../MonthPicker/MonthPicker.css'

export interface YearPickerProps extends FieldProps, NativeDivProps {
  value?: number | null
  defaultValue?: number | null
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  /** Year shown first when empty. */
  currentYear?: number
  placeholder?: string
}

const PAGE = 12

/** A calendar year (budget year, statistics). The value is a number, e.g. `2026`. */
export function YearPicker(props: YearPickerProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, min, max, currentYear, placeholder = 'Select year', ...native } = rest
  const [fallbackYear] = useState(() => new Date().getFullYear())
  const thisYear = currentYear ?? fallbackYear
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(Math.floor((current ?? thisYear) / PAGE) * PAGE)
  const [focused, setFocused] = useState(String(current ?? thisYear))
  const triggerRef = useRef<HTMLDivElement>(null)

  const cells = Array.from({ length: PAGE }, (_, i) => {
    const y = start + i
    return { key: String(y), label: String(y), disabled: (min !== undefined && y < min) || (max !== undefined && y > max) }
  })
  const page = (dir: -1 | 1) => {
    setStart((s) => s + dir * PAGE)
    setFocused((f) => String(Number(f) + dir * PAGE))
  }

  return (
    <FormField
      {...field}
      className={cx('erp-year-picker', field.className)}
    >
      {(f) => (
        <div {...native}>
          <PickerTrigger
            ref={triggerRef}
            controlProps={f.controlProps}
            labelId={field.label != null ? f.labelId : undefined}
            open={open}
            onToggle={() => {
              const base = current ?? thisYear
              setStart(Math.floor(base / PAGE) * PAGE)
              setFocused(String(base))
              setOpen((o) => !o)
            }}
            text={current === null ? null : String(current)}
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
            aria-label='Choose year'
            onClose={(reason) => {
              setOpen(false)
              if (reason === 'escape') triggerRef.current?.focus()
            }}
          >
            <div className='erp-month-picker__header'>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Previous years'
                onClick={() => {
                  page(-1)
                }}
              >
                <Icon name='chevron-left' />
              </button>
              <span aria-live='polite'>
                {start} – {start + PAGE - 1}
              </span>
              <button
                type='button'
                className='erp-input-action'
                aria-label='Next years'
                onClick={() => {
                  page(1)
                }}
              >
                <Icon name='chevron-right' />
              </button>
            </div>
            <PeriodGrid
              label='Years'
              cells={cells}
              columns={4}
              selected={current === null ? null : String(current)}
              focused={cells.some((c) => c.key === focused) ? focused : (cells[0]?.key ?? focused)}
              onFocusChange={setFocused}
              onPage={page}
              autoFocus
              onSelect={(key) => {
                setCurrent(Number(key))
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

