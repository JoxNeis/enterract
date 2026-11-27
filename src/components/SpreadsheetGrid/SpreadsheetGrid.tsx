import { useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { FillHandle, RangeStatusBar, useCellRange, type CellRange, type CellWrite } from '../../internal/cellRange'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { useLocale } from '../LocaleProvider'
import { address, columnName, evaluateSheet, isError, shiftFormula, type CellValue, type Sheet } from './formula'
import '../../styles/base.css'
import './SpreadsheetGrid.css'

export interface SpreadsheetGridProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** Raw contents by A1 address (`{ A1: '10', B1: '=A1*2' }`). */
  value?: Sheet
  defaultValue?: Sheet
  onChange?: (sheet: Sheet) => void
  rows?: number
  columns?: number
  readOnly?: boolean
  /** Number formatting of computed values. */
  numberFormat?: Intl.NumberFormatOptions
  'aria-label': string
}

/**
 * Spreadsheet with A1 references and formulas (`=SUM(A1:A5)*1.1`, `$A$1` for fixed references).
 * Select with the mouse (click, drag, Shift+click) or Shift+arrows; typing or F2 edits; Enter/Tab
 * commit; Delete clears; Ctrl+C / Ctrl+X / Ctrl+V work with Excel; drag the fill handle or press
 * Ctrl+D / Ctrl+R to fill (formulas shift their relative references).
 */
export function SpreadsheetGrid({
  value,
  defaultValue = {},
  onChange,
  rows = 20,
  columns = 8,
  readOnly = false,
  numberFormat,
  className,
  'aria-label': ariaLabel,
  ...props
}: SpreadsheetGridProps) {
  const { locale } = useLocale()
  const [sheet, setSheet] = useControllableState<Sheet>({
    value,
    defaultValue,
    onChange: onChange
      ? (s) => {
          onChange(s)
        }
      : undefined,
  })
  const computed = useMemo(() => evaluateSheet(sheet), [sheet])
  const [editing, setEditing] = useState<{ text: string; inBar: boolean } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const display = (v: CellValue) =>
    v === null ? '' : typeof v === 'number' ? new Intl.NumberFormat(locale, { maximumFractionDigits: 10, ...numberFormat }).format(v) : v

  const write = (changes: Record<string, string>) => {
    const merged: Sheet = { ...sheet, ...changes }
    setSheet(Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== '')))
  }

  const writeCells = (targets: CellWrite[]) => {
    const changes: Record<string, string> = {}
    for (const t of targets) {
      if (t.r >= rows || t.c >= columns) continue
      // Fills copy the source's raw contents, moving relative references; series write numbers.
      changes[address(t.c, t.r)] =
        t.from && !t.series ? shiftFormula(sheet[address(t.from.c, t.from.r)] ?? '', t.r - t.from.r, t.c - t.from.c) : t.text
    }
    write(changes)
    return { written: Object.keys(changes).length, failed: 0 }
  }

  const clearCells = (range: CellRange) => {
    const changes: Record<string, string> = {}
    for (let r = range.r0; r <= range.r1; r++) for (let c = range.c0; c <= range.c1; c++) changes[address(c, r)] = ''
    write(changes)
  }

  const cells = useCellRange({
    rows,
    cols: columns,
    gridRef: tableRef,
    blocked: editing !== null,
    getText: (r, c) => {
      const v = computed[address(c, r)] ?? null
      return v === null ? '' : String(v)
    },
    getValue: (r, c) => computed[address(c, r)] ?? null,
    write: readOnly ? undefined : writeCells,
    clear: readOnly ? undefined : clearCells,
  })
  const { active } = cells
  const ref = address(active.c, active.r)

  const commit = (move: 'down' | 'right' | 'none') => {
    if (!editing) return
    write({ [ref]: editing.text })
    setEditing(null)
    cells.requestFocus()
    if (move === 'down') cells.setActive({ r: Math.min(active.r + 1, rows - 1), c: active.c })
    if (move === 'right') cells.setActive({ r: active.r, c: Math.min(active.c + 1, columns - 1) })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing) return
    if (cells.onKeyDown(event)) return
    const { key, shiftKey } = event
    const ctrl = event.ctrlKey || event.metaKey
    if (key === 'Tab') {
      event.preventDefault()
      cells.move(active.r, active.c + (shiftKey ? -1 : 1))
    } else if (key === 'Enter') {
      event.preventDefault()
      cells.move(active.r + (shiftKey ? -1 : 1), active.c)
    } else if (key === 'F2' && !readOnly) {
      event.preventDefault()
      setEditing({ text: sheet[ref] ?? '', inBar: false })
    } else if (key.length === 1 && !ctrl && !event.altKey && !readOnly) {
      event.preventDefault()
      setEditing({ text: key, inBar: false })
    }
  }

  const editorKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit('down')
    } else if (event.key === 'Tab') {
      event.preventDefault()
      commit('right')
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(null)
      cells.requestFocus()
    }
  }

  const activeValue = computed[ref] ?? null

  return (
    <div
      className={cx('erp-spreadsheet', className)}
      {...props}
    >
      <div className='erp-spreadsheet__bar'>
        <span
          className='erp-spreadsheet__address'
          aria-label='Active cell'
        >
          {cells.multi ? `${address(cells.range.c0, cells.range.r0)}:${address(cells.range.c1, cells.range.r1)}` : ref}
        </span>
        <input
          className='erp-spreadsheet__formula'
          aria-label={`Contents of ${ref}`}
          readOnly={readOnly}
          value={editing?.inBar ? editing.text : (editing?.text ?? sheet[ref] ?? '')}
          onFocus={() => {
            if (!readOnly && !editing) setEditing({ text: sheet[ref] ?? '', inBar: true })
          }}
          onChange={(e) => {
            setEditing({ text: e.target.value, inBar: true })
          }}
          onKeyDown={editorKeys}
          onBlur={() => {
            if (editing?.inBar) commit('none')
          }}
        />
        <span className='erp-spreadsheet__result'>{isError(activeValue) ? activeValue : display(activeValue)}</span>
      </div>
      <div className='erp-spreadsheet__scroller'>
        <table
          ref={tableRef}
          role='grid'
          aria-label={ariaLabel}
          aria-readonly={flag(readOnly)}
          aria-multiselectable='true'
          aria-rowcount={rows + 1}
          aria-colcount={columns + 1}
          className='erp-spreadsheet__table'
          onKeyDown={onKeyDown}
          onCopy={cells.onCopy}
          onCut={cells.onCut}
          onPaste={cells.onPaste}
        >
          <thead>
            <tr role='row'>
              <th
                role='columnheader'
                aria-label='Row numbers'
              />
              {Array.from({ length: columns }, (_, c) => (
                <th
                  key={c}
                  role='columnheader'
                  data-active={flag(cells.colSelected(c))}
                >
                  {columnName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr
                key={r}
                role='row'
              >
                <th
                  role='rowheader'
                  data-active={flag(cells.rowSelected(r))}
                >
                  {r + 1}
                </th>
                {Array.from({ length: columns }, (_, c) => {
                  const cellRef = address(c, r)
                  const v = computed[cellRef] ?? null
                  const isActive = r === active.r && c === active.c
                  const isEditing = isActive && editing !== null && !editing.inBar
                  const raw = sheet[cellRef] ?? ''
                  return (
                    <td
                      key={c}
                      role='gridcell'
                      {...cells.cellProps(r, c, isEditing)}
                      data-ref={cellRef}
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`${cellRef}${v === null ? '' : `: ${display(v)}`}${raw.startsWith('=') ? `, formula ${raw}` : ''}`}
                      data-number={flag(typeof v === 'number')}
                      data-error={flag(isError(v))}
                      data-formula={flag(raw.startsWith('='))}
                      className='erp-spreadsheet__cell'
                      onDoubleClick={() => {
                        if (!readOnly) setEditing({ text: raw, inBar: false })
                      }}
                    >
                      {isEditing ? (
                        <input
                          className='erp-spreadsheet__editor'
                          aria-label={`Edit ${cellRef}`}
                          autoFocus
                          value={editing.text}
                          onChange={(e) => {
                            setEditing({ text: e.target.value, inBar: false })
                          }}
                          onKeyDown={editorKeys}
                          onBlur={() => {
                            commit('none')
                          }}
                        />
                      ) : (
                        display(v)
                      )}
                      {!isEditing && cells.hasFillHandle(r, c) && <FillHandle onMouseDown={cells.startFill} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RangeStatusBar
        message={cells.message}
        summary={cells.summary}
        locale={locale}
      />
    </div>
  )
}
