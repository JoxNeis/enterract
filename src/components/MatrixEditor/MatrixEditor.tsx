import { useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { FillHandle, RangeStatusBar, useCellRange, type CellRange, type CellWrite } from '../../internal/cellRange'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatNumber, formatNumberForEdit, parseNumber } from '../../utils/number'
import type { Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { useLocale } from '../LocaleProvider'
import './MatrixEditor.css'

export type MatrixValue = Record<string, Record<string, number | null>>

export interface MatrixEditorProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** Row dimension (e.g. sizes, accounts). */
  rows: readonly Option[]
  /** Column dimension (e.g. colors, periods). */
  columns: readonly Option[]
  value?: MatrixValue
  defaultValue?: MatrixValue
  onChange?: (value: MatrixValue) => void
  /** Header of the row labels column. */
  rowHeader?: string
  /** Decimal places allowed. */
  precision?: number
  showTotals?: boolean
  readOnly?: boolean
  'aria-label': string
}

interface EditState {
  r: number
  c: number
  text: string
}

/**
 * Two-dimensional number entry (size × color quantities, account × period budgets) with row and
 * column totals. Works like a small spreadsheet: select with the mouse or Shift+arrows, type or
 * press Enter/F2 to edit, Ctrl+C / Ctrl+X / Ctrl+V with Excel, drag the fill handle or press
 * Ctrl+D / Ctrl+R to fill, Delete to clear.
 */
export function MatrixEditor({
  rows,
  columns,
  value,
  defaultValue = {},
  onChange,
  rowHeader = '',
  precision = 0,
  showTotals = true,
  readOnly = false,
  className,
  'aria-label': ariaLabel,
  ...props
}: MatrixEditorProps) {
  const { locale } = useLocale()
  const [matrix, setMatrix] = useControllableState<MatrixValue>({
    value,
    defaultValue,
    onChange: onChange
      ? (m) => {
          onChange(m)
        }
      : undefined,
  })
  const [editing, setEditing] = useState<EditState | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const get = (r: string, c: string) => matrix[r]?.[c] ?? null
  const fmt = (n: number) => formatNumber(n, locale, { maximumFractionDigits: precision, minimumFractionDigits: precision })

  const decimalsOk = (n: number) => (String(n).split('.')[1]?.length ?? 0) <= precision
  /** Number, null for empty, or undefined when the text is not a valid amount. */
  const parse = (text: string): number | null | undefined => {
    const result = parseNumber(text, locale)
    if (!result.ok) return undefined
    if (result.value !== null && !decimalsOk(result.value)) return undefined
    return result.value
  }

  const set = (changes: { r: string; c: string; v: number | null }[]) => {
    if (!changes.length) return
    const next: MatrixValue = { ...matrix }
    for (const { r, c, v } of changes) next[r] = { ...next[r], [c]: v }
    setMatrix(next)
  }

  const rowTotal = (r: string) => columns.reduce((s, c) => s + (get(r, c.key) ?? 0), 0)
  const colTotal = (c: string) => rows.reduce((s, r) => s + (get(r.key, c) ?? 0), 0)
  const grand = rows.reduce((s, r) => s + rowTotal(r.key), 0)

  // Grid coordinates: data cells, then the totals column and the totals row (read-only).
  const gridRows = rows.length + (showTotals ? 1 : 0)
  const gridCols = columns.length + (showTotals ? 1 : 0)
  const isData = (ri: number, ci: number) => ri < rows.length && ci < columns.length
  const valueAt = (ri: number, ci: number): number | null => {
    const r = rows[ri]
    const c = columns[ci]
    if (r && c) return get(r.key, c.key)
    if (r) return rowTotal(r.key)
    if (c) return colTotal(c.key)
    return showTotals ? grand : null
  }
  const editable = !readOnly

  const writeCells = (targets: CellWrite[]) => {
    const changes: { r: string; c: string; v: number | null }[] = []
    let failed = 0
    for (const t of targets) {
      const r = rows[t.r]
      const c = columns[t.c]
      if (!r || !c) continue
      const v = typeof t.value === 'number' ? (decimalsOk(t.value) ? t.value : undefined) : parse(t.text)
      if (v === undefined) {
        failed += 1
        continue
      }
      changes.push({ r: r.key, c: c.key, v })
    }
    set(changes)
    return { written: changes.length, failed }
  }

  const clearCells = (range: CellRange) => {
    const changes: { r: string; c: string; v: number | null }[] = []
    for (let ri = range.r0; ri <= range.r1; ri++)
      for (let ci = range.c0; ci <= range.c1; ci++) {
        const r = rows[ri]
        const c = columns[ci]
        if (r && c && get(r.key, c.key) !== null) changes.push({ r: r.key, c: c.key, v: null })
      }
    set(changes)
  }

  const cells = useCellRange({
    rows: gridRows,
    cols: gridCols,
    gridRef: tableRef,
    blocked: editing !== null,
    getText: (ri, ci) => {
      const v = valueAt(ri, ci)
      return v === null ? '' : String(v)
    },
    getValue: valueAt,
    getHeader: (ci) => columns[ci]?.label ?? 'Total',
    getRowHeader: (ri) => rows[ri]?.label ?? 'Total',
    write: editable ? writeCells : undefined,
    clear: editable ? clearCells : undefined,
  })
  const { active } = cells

  const startEdit = (ri: number, ci: number, seed?: string) => {
    if (!editable || !isData(ri, ci)) return
    const v = valueAt(ri, ci)
    setEditing({ r: ri, c: ci, text: seed ?? (v === null ? '' : formatNumberForEdit(v, locale)) })
  }

  /** Saves the editor when its text is valid. Returns false (and keeps editing) when it is not. */
  const commit = (move: 'down' | 'right' | 'left' | 'none'): boolean => {
    if (!editing) return true
    const v = parse(editing.text)
    if (v === undefined) return false
    const r = rows[editing.r]
    const c = columns[editing.c]
    if (r && c && v !== get(r.key, c.key)) set([{ r: r.key, c: c.key, v }])
    setEditing(null)
    cells.requestFocus()
    if (move === 'down') cells.setActive({ r: Math.min(editing.r + 1, rows.length - 1), c: editing.c })
    if (move === 'right') cells.setActive({ r: editing.r, c: Math.min(editing.c + 1, columns.length - 1) })
    if (move === 'left') cells.setActive({ r: editing.r, c: Math.max(editing.c - 1, 0) })
    return true
  }

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing || !(event.target as HTMLElement).hasAttribute('data-cell')) return
    if (cells.onKeyDown(event)) return
    const { key } = event
    const ctrl = event.ctrlKey || event.metaKey
    if (key === 'Enter' || key === 'F2') {
      event.preventDefault()
      startEdit(active.r, active.c)
    } else if (key.length === 1 && !ctrl && !event.altKey && /[\d.,\-+]/.test(key)) {
      event.preventDefault()
      startEdit(active.r, active.c, key)
    }
  }

  const onEditorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit('down')
    } else if (event.key === 'Tab') {
      if (commit(event.shiftKey ? 'left' : 'right')) event.preventDefault()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(null)
      cells.requestFocus()
    }
  }

  const cell = (ri: number, ci: number, label: string, className?: string) => {
    const data = isData(ri, ci)
    const v = valueAt(ri, ci)
    const isActive = active.r === ri && active.c === ci
    const isEditing = editing?.r === ri && editing.c === ci
    const invalid = isEditing && parse(editing.text) === undefined
    return (
      <td
        key={ci}
        role='gridcell'
        className={cx('erp-matrix-editor__cell', className)}
        tabIndex={isActive && !isEditing ? 0 : -1}
        aria-label={isEditing ? undefined : `${label}: ${v === null ? 'empty' : fmt(v)}`}
        aria-readonly={flag(!data || readOnly)}
        data-editing={flag(isEditing)}
        {...cells.cellProps(ri, ci, isEditing)}
        onDoubleClick={() => {
          startEdit(ri, ci)
        }}
      >
        {isEditing ? (
          <input
            type='text'
            inputMode='decimal'
            className='erp-matrix-editor__input'
            aria-label={label}
            aria-invalid={flag(invalid)}
            autoFocus
            value={editing.text}
            onChange={(event) => {
              setEditing({ ...editing, text: event.target.value })
            }}
            onKeyDown={onEditorKeyDown}
            onBlur={() => {
              if (!commit('none')) setEditing(null)
            }}
          />
        ) : v === null ? (
          ''
        ) : (
          fmt(v)
        )}
        {!isEditing && data && cells.hasFillHandle(ri, ci) && <FillHandle onMouseDown={cells.startFill} />}
      </td>
    )
  }

  return (
    <div
      className={cx('erp-matrix-editor', className)}
      {...props}
    >
      <div className='erp-matrix-editor__scroller'>
        <table
          ref={tableRef}
          role='grid'
          aria-label={ariaLabel}
          aria-readonly={flag(readOnly)}
          aria-multiselectable='true'
          onKeyDown={onGridKeyDown}
          onCopy={cells.onCopy}
          onCut={cells.onCut}
          onPaste={cells.onPaste}
        >
          <thead>
            <tr role='row'>
              <th
                role='columnheader'
                scope='col'
              >
                {rowHeader}
              </th>
              {columns.map((c, ci) => (
                <th
                  key={c.key}
                  role='columnheader'
                  scope='col'
                  data-range-col={flag(cells.multi && cells.colSelected(ci))}
                >
                  {c.label}
                </th>
              ))}
              {showTotals && (
                <th
                  role='columnheader'
                  scope='col'
                  className='erp-matrix-editor__total'
                >
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={r.key}
                role='row'
              >
                <th
                  role='rowheader'
                  scope='row'
                  data-range-row={flag(cells.multi && cells.rowSelected(ri))}
                >
                  {r.label}
                </th>
                {columns.map((c, ci) => cell(ri, ci, `${r.label}, ${c.label}`))}
                {showTotals && cell(ri, columns.length, `${r.label}, Total`, 'erp-matrix-editor__total')}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot>
              <tr role='row'>
                <th
                  role='rowheader'
                  scope='row'
                >
                  Total
                </th>
                {columns.map((c, ci) => cell(rows.length, ci, `Total, ${c.label}`, 'erp-matrix-editor__total'))}
                {cell(rows.length, columns.length, 'Grand total', 'erp-matrix-editor__total erp-matrix-editor__grand')}
              </tr>
            </tfoot>
          )}
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
