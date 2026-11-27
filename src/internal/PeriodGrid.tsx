import { useEffect, useRef, type KeyboardEvent } from 'react'
import { flag } from '../utils/flag'
import '../styles/base.css'
import './PeriodGrid.css'

export interface PeriodCell {
  key: string
  label: string
  /** Full name for screen readers. */
  ariaLabel?: string
  disabled?: boolean
  /** Extra marker text, e.g. "Closed". */
  note?: string
}

export interface PeriodGridProps {
  cells: readonly PeriodCell[]
  columns: number
  selected: string | null
  focused: string
  onFocusChange: (key: string) => void
  onSelect: (key: string) => void
  /** Arrow past the first/last cell. */
  onPage?: (direction: -1 | 1) => void
  label: string
  autoFocus?: boolean
}

/** Grid of months, years or periods with arrow-key navigation (internal: MonthPicker, YearPicker, FiscalPeriodPicker). */
export function PeriodGrid({ cells, columns, selected, focused, onFocusChange, onSelect, onPage, label, autoFocus = false }: PeriodGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const moved = useRef(autoFocus)

  useEffect(() => {
    if (!moved.current) return
    Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find((b) => b.dataset.key === focused)
      ?.focus()
  }, [focused])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = cells.findIndex((c) => c.key === focused)
    const delta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }
    const d = delta[event.key]
    if (d !== undefined) {
      event.preventDefault()
      moved.current = true
      const next = index + d
      if (next < 0) onPage?.(-1)
      else if (next >= cells.length) onPage?.(1)
      else onFocusChange(cells[next]?.key ?? focused)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      moved.current = true
      onFocusChange((event.key === 'Home' ? cells[0] : cells[cells.length - 1])?.key ?? focused)
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      moved.current = true
      onPage?.(event.key === 'PageUp' ? -1 : 1)
    }
  }

  return (
    <div
      ref={ref}
      role='grid'
      aria-label={label}
      className='erp-period-grid'
      style={{ gridTemplateColumns: `repeat(${String(columns)}, 1fr)` }}
      onKeyDown={onKeyDown}
    >
      {cells.map((c) => (
        <button
          key={c.key}
          type='button'
          role='gridcell'
          data-key={c.key}
          className='erp-period-grid__cell'
          aria-selected={c.key === selected}
          aria-label={c.ariaLabel}
          aria-disabled={flag(c.disabled)}
          tabIndex={c.key === focused ? 0 : -1}
          onClick={() => {
            onFocusChange(c.key)
            if (!c.disabled) onSelect(c.key)
          }}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !c.disabled) {
              event.preventDefault()
              onSelect(c.key)
            }
          }}
        >
          <span>{c.label}</span>
          {c.note && <span className='erp-period-grid__note'>{c.note}</span>}
        </button>
      ))}
    </div>
  )
}
