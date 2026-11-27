import {
  Fragment,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { FillHandle, RangeSummaryText, useCellRange, type CellPos, type CellRange, type CellWrite, type WriteResult } from '../../internal/cellRange'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { toText } from '../../utils/text'
import type { Size } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { parsePastedValue } from './clipboard'
import { downloadCsv } from './exportCsv'
import { aggregate, cellValue, columnKey, columnLabel, compareCells, copyText, displayText } from './format'
import { GridCellEditor, type EditorExit } from './GridCellEditor'
import {
  createAddedRow,
  deleteRows,
  isCellReadOnly,
  sameValue,
  updateCell,
  validateRow,
  validateRows,
} from './gridRows'
import type { FieldOf, GridColumn, GridRow, GridSort } from './types'
import '../../styles/base.css'
import './DataGrid.css'

export interface DataGridProps<TData, TMeta = undefined>
  extends Omit<ComponentProps<'div'>, 'onChange' | 'children'> {
  rows: GridRow<TData, TMeta>[]
  /** Called with the new rows after every edit, paste, add, delete, undo or redo. Required when editable. */
  onRowsChange?: (rows: GridRow<TData, TMeta>[]) => void
  columns: GridColumn<TData, TMeta>[]
  /** Grid-level lock, e.g. for posted documents. Defaults to true when any column has an editor. */
  editable?: boolean
  /** Shows an Add row button; Ctrl+Enter adds a row below. */
  allowAdd?: boolean
  /** Shows a Delete button for the selected (or active) rows. */
  allowDelete?: boolean
  /** Pasting past the last row adds rows. */
  allowAddOnPaste?: boolean
  /** Shows the change marker column. Defaults to true when editable. */
  showStatusColumn?: boolean
  /** Row selection with checkboxes. */
  selectionMode?: 'none' | 'single' | 'multiple'
  selectedIds?: readonly string[]
  defaultSelectedIds?: readonly string[]
  onSelectionChange?: (ids: string[]) => void
  /** Number and date parsing/formatting. Defaults to the LocaleProvider. */
  locale?: string
  /** Called for each cell a paste could not write. */
  onCellError?: (id: string, field: FieldOf<TData>, message: string) => void
  /** Grids default to compact. */
  size?: Size
  /** Data for a new row. Defaults to empty values per editor. */
  newRow?: () => TData
  /** Meta for a new row. */
  newRowMeta?: () => TMeta
  /** Controlled sort. */
  sort?: GridSort<TData> | null
  onSortChange?: (sort: GridSort<TData> | null) => void
  /** Client-side paging. */
  pageSize?: number
  /** Master-detail: content shown under an expanded row. */
  renderDetail?: (row: GridRow<TData, TMeta>) => ReactNode
  /** Group rows by a field, with subtotals for columns that have `aggregate`. */
  groupBy?: FieldOf<TData>
  /** Shows a footer row with column aggregates. Defaults to true when a column has `aggregate`. */
  showFooter?: boolean
  /** Shows an Export CSV button. */
  allowExport?: boolean
  exportFileName?: string
  /** Max height of the scroll area (header stays visible). */
  height?: number | string
  emptyText?: ReactNode
  /** Extra toolbar content (left side). */
  toolbar?: ReactNode
  /** Accessible name of the grid. */
  'aria-label'?: string
}

interface EditState {
  rowId: string
  field: string
  draft: unknown
  seeded: boolean
  open: boolean
}

const DEFAULT_WIDTH = 140
const STATUS_WIDTH = 28
const SELECT_WIDTH = 36
const EXPAND_WIDTH = 32
const HISTORY_LIMIT = 100

function emptyValue<TData, TMeta>(column: GridColumn<TData, TMeta>): unknown {
  return column.editor === 'checkbox' ? false : column.editor === 'multiselect' ? [] : null
}

function seedValue<TData, TMeta>(column: GridColumn<TData, TMeta>, char: string, current: unknown): unknown {
  switch (column.editor) {
    case 'number':
      return /\d/.test(char) ? Number(char) : null
    case 'currency':
      return /\d/.test(char) ? char : null
    case 'text':
    case undefined:
      return char
    default:
      return current
  }
}

const statusLabel = { added: 'Added', modified: 'Modified', deleted: 'Deleted', unchanged: '' } as const

/**
 * Tabular data with in-cell editing, row change tracking, typed row metadata and
 * Excel-compatible copy/paste (WAI-ARIA grid pattern). Pair it with `useGridRows`.
 *
 * Row shape: `{ id, data: TData, meta: TMeta, status, original?, changedFields?, errors? }`.
 * Column shape: `{ field, header, editor?, options?, readOnly?, required?, validate?, format?,
 * parse?, copyAs?, width?, frozen?, aggregate? }`. See `GridRow` and `GridColumn`.
 */
export function DataGrid<TData, TMeta = undefined>({
  rows,
  onRowsChange,
  columns,
  editable: editableProp,
  allowAdd = false,
  allowDelete = false,
  allowAddOnPaste = false,
  showStatusColumn: showStatusProp,
  selectionMode = 'none',
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  locale: localeProp,
  onCellError,
  size = 'sm',
  newRow,
  newRowMeta,
  sort: sortProp,
  onSortChange,
  pageSize,
  renderDetail,
  groupBy,
  showFooter: showFooterProp,
  allowExport = false,
  exportFileName = 'export.csv',
  height,
  emptyText = 'No rows',
  toolbar,
  className,
  'aria-label': ariaLabel = 'Data grid',
  ...props
}: DataGridProps<TData, TMeta>) {
  const settings = useLocale(localeProp)
  const { locale, currency } = settings
  const editable = editableProp ?? columns.some((c) => c.editor !== undefined || c.renderEditor !== undefined)
  const showStatus = showStatusProp ?? editable
  const [selected, setSelected] = useControllableState<readonly string[]>({
    value: selectedIds,
    defaultValue: defaultSelectedIds,
    onChange: onSelectionChange ? (ids) => { onSelectionChange([...ids]) } : undefined,
  })
  const [sort, setSort] = useControllableState<GridSort<TData> | null>({
    value: sortProp,
    defaultValue: null,
    onChange: onSortChange,
  })
  const [editing, setEditing] = useState<EditState | null>(null)
  const [page, setPage] = useState(0)
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const history = useRef<{ undo: GridRow<TData, TMeta>[][]; redo: GridRow<TData, TMeta>[][]; last: unknown }>({
    undo: [],
    redo: [],
    last: null,
  })
  const tableRef = useRef<HTMLTableElement>(null)

  const dataColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns])
  const liveRows = useMemo(() => rows.filter((r) => r.status !== 'deleted'), [rows])
  const sortedRows = useMemo(() => {
    if (!sort) return liveRows
    const column = columns.find((c) => columnKey(c) === sort.field)
    if (!column) return liveRows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...liveRows].sort((a, b) => factor * compareCells(column, cellValue(column, a), cellValue(column, b), locale))
  }, [liveRows, sort, columns, locale])

  const groupColumn = groupBy ? columns.find((c) => c.field === groupBy) : undefined
  const groups = useMemo(() => {
    if (!groupBy) return null
    const map = new Map<string, GridRow<TData, TMeta>[]>()
    for (const row of sortedRows) {
      const value = row.data[groupBy] as unknown
      const key = toText(value)
      const list = map.get(key)
      if (list) list.push(row)
      else map.set(key, [row])
    }
    return [...map.entries()].map(([key, groupRows]) => ({ key, rows: groupRows }))
  }, [sortedRows, groupBy])

  const pageCount = pageSize && !groups ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => (pageSize && !groups ? sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : sortedRows),
    [pageSize, groups, sortedRows, currentPage]
  )
  const visibleRows = useMemo(
    () => (groups ? groups.flatMap((g) => (collapsed.has(g.key) ? [] : g.rows)) : pageRows),
    [groups, collapsed, pageRows]
  )
  const rowNumber = useMemo(() => new Map(sortedRows.map((r, i) => [r.id, i + 1])), [sortedRows])
  const errorsById = useMemo(() => new Map(rows.map((r) => [r.id, validateRow(r, columns)])), [rows, columns])

  // ---------- changes ----------

  const emit = (next: GridRow<TData, TMeta>[]) => {
    const h = history.current
    if (h.last !== null && h.last !== rows) {
      h.undo = []
      h.redo = []
    }
    h.undo.push(rows)
    if (h.undo.length > HISTORY_LIMIT) h.undo.shift()
    h.redo = []
    const validated = validateRows(next, columns)
    h.last = validated
    onRowsChange?.(validated)
  }

  const undoRedo = (direction: 'undo' | 'redo') => {
    const h = history.current
    if (h.last !== rows) {
      h.undo = []
      h.redo = []
      return
    }
    const from = direction === 'undo' ? h.undo : h.redo
    const to = direction === 'undo' ? h.redo : h.undo
    const target = from.pop()
    if (!target) return
    to.push(rows)
    h.last = target
    onRowsChange?.(target)
  }

  const canEdit = (row: GridRow<TData, TMeta> | undefined, column: GridColumn<TData, TMeta> | undefined) =>
    Boolean(
      row &&
        column &&
        editable &&
        (column.editor !== undefined || column.renderEditor !== undefined) &&
        !isCellReadOnly(column, row)
    )

  const setCell = (rowId: string, field: FieldOf<TData>, value: unknown) => {
    const row = rows.find((r) => r.id === rowId)
    if (!row || sameValue(row.data[field], value)) return
    emit(rows.map((r) => (r.id === rowId ? updateCell(r, field, value) : r)))
  }

  const makeRow = () => {
    const data =
      newRow?.() ?? (Object.fromEntries(columns.map((c) => [c.field, emptyValue(c)])) as unknown as TData)
    return createAddedRow<TData, TMeta>(data, newRowMeta?.() as TMeta)
  }

  // ---------- cell writes (paste, fill, clear) ----------

  const writeCells = (targets: CellWrite[]): WriteResult => {
    const next = [...rows]
    const visibleIds = visibleRows.map((r) => r.id)
    const lastVisible = visibleRows[visibleRows.length - 1]
    let insertAt = lastVisible ? next.findIndex((r) => r.id === lastVisible.id) + 1 : next.length
    let failed = 0
    let written = 0
    for (const t of targets) {
      const column = dataColumns[t.c]
      if (!column) continue
      if (t.r >= visibleIds.length) {
        if (!allowAddOnPaste) continue
        while (visibleIds.length <= t.r) {
          const row = makeRow()
          next.splice(insertAt, 0, row)
          insertAt += 1
          visibleIds.push(row.id)
        }
      }
      const id = visibleIds[t.r]
      if (id === undefined) continue
      const index = next.findIndex((r) => r.id === id)
      const row = next[index]
      if (!row || !canEdit(row, column)) continue
      // Fills between columns of the same kind copy the raw value; everything else is parsed text.
      const source = t.from ? dataColumns[t.from.c] : undefined
      const parsed =
        t.value !== undefined && source?.editor === column.editor && !column.parse
          ? { ok: true as const, value: column.editor === 'currency' && typeof t.value === 'number' ? String(t.value) : t.value }
          : parsePastedValue(column, row, t.text, locale)
      if (!parsed.ok) {
        failed += 1
        onCellError?.(id, column.field, `Could not paste "${t.text}" into ${columnLabel(column)}`)
        continue
      }
      next[index] = updateCell(row, column.field, parsed.value ?? emptyValue(column))
      written += 1
    }
    if (written > 0 || next.length !== rows.length) emit(next)
    return { written, failed }
  }

  const clearCells = (target: CellRange) => {
    let next = rows
    for (let r = target.r0; r <= target.r1; r++) {
      for (let c = target.c0; c <= target.c1; c++) {
        const row = visibleRows[r]
        const column = dataColumns[c]
        if (!row || !column || column.required || !canEdit(row, column)) continue
        next = next.map((x) => (x.id === row.id ? updateCell(x, column.field, emptyValue(column)) : x))
      }
    }
    if (next !== rows) emit(next)
  }

  const cells = useCellRange({
    rows: visibleRows.length,
    cols: dataColumns.length,
    gridRef: tableRef,
    blocked: editing !== null,
    getText: (r, c) => {
      const row = visibleRows[r]
      const column = dataColumns[c]
      return row && column ? copyText(column, row, cellValue(column, row), locale, currency) : ''
    },
    getValue: (r, c) => {
      const row = visibleRows[r]
      const column = dataColumns[c]
      return row && column ? cellValue(column, row) : null
    },
    getHeader: (c) => {
      const column = dataColumns[c]
      return column ? columnLabel(column) : ''
    },
    write: editable ? writeCells : undefined,
    clear: editable ? clearCells : undefined,
  })
  const act = cells.active
  const maxR = visibleRows.length - 1
  const maxC = dataColumns.length - 1

  const addRowBelow = () => {
    if (!editable) return
    const row = makeRow()
    const after = visibleRows[act.r]
    const index = after ? rows.findIndex((r) => r.id === after.id) + 1 : rows.length
    emit([...rows.slice(0, index), row, ...rows.slice(index)])
    cells.setActive({ r: after ? act.r + 1 : visibleRows.length, c: 0 }, true)
  }

  const removeRows = () => {
    if (!editable) return
    const activeRow = visibleRows[act.r]
    const ids = selected.length ? [...selected] : activeRow ? [activeRow.id] : []
    if (!ids.length) return
    emit(deleteRows(rows, ids))
    setSelected(selected.filter((id) => !ids.includes(id)))
  }

  // ---------- editing ----------

  const startEdit = (pos: CellPos, seed?: string, open = false) => {
    const row = visibleRows[pos.r]
    const column = dataColumns[pos.c]
    if (!row || !column || !canEdit(row, column)) return
    if (column.editor === 'checkbox') {
      setCell(row.id, column.field, !row.data[column.field])
      return
    }
    const current = row.data[column.field] as unknown
    setEditing({
      rowId: row.id,
      field: column.field,
      draft: seed === undefined ? current : seedValue(column, seed, current),
      seeded: seed !== undefined,
      open,
    })
  }

  const commitEdit = (value: unknown, exit: EditorExit) => {
    if (!editing) return
    setCell(editing.rowId, editing.field as FieldOf<TData>, value)
    setEditing(null)
    if (exit !== 'none' || tableRef.current?.contains(document.activeElement) === true || document.activeElement === document.body)
      cells.requestFocus()
    if (exit === 'down') cells.setActive({ r: Math.min(act.r + 1, maxR), c: act.c })
    if (exit === 'right') cells.setActive(act.c < maxC ? { r: act.r, c: act.c + 1 } : { r: Math.min(act.r + 1, maxR), c: 0 })
    if (exit === 'left') cells.setActive(act.c > 0 ? { r: act.r, c: act.c - 1 } : { r: Math.max(act.r - 1, 0), c: maxC })
  }

  const cancelEdit = () => {
    setEditing(null)
    cells.requestFocus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing || event.defaultPrevented) return
    const target = event.target as HTMLElement
    if (!target.hasAttribute('data-cell')) return
    // Selection, clipboard shortcuts, fill (Ctrl+D / Ctrl+R) and Delete.
    if (cells.onKeyDown(event)) return
    const { key, shiftKey } = event
    const ctrl = event.ctrlKey || event.metaKey
    const k = key.toLowerCase()
    const row = visibleRows[act.r]
    const column = dataColumns[act.c]
    const handled = () => {
      event.preventDefault()
    }

    if (ctrl && !shiftKey && k === 'z') {
      handled()
      undoRedo('undo')
    } else if (ctrl && (k === 'y' || (shiftKey && k === 'z'))) {
      handled()
      undoRedo('redo')
    } else if (ctrl && key === 'Enter') {
      if (allowAdd) {
        handled()
        addRowBelow()
      }
    } else if (key === 'Enter' || key === 'F2') {
      handled()
      startEdit(act)
    } else if (key === ' ') {
      if (column?.editor === 'checkbox' || column?.editor === 'select') {
        handled()
        startEdit(act, undefined, true)
      }
    } else if (key.length === 1 && !ctrl && !event.altKey && row && column && canEdit(row, column)) {
      handled()
      startEdit(act, key)
    }
  }

  // ---------- selection ----------

  const selectedSet = new Set(selected)
  const pageIds = visibleRows.map((r) => r.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id))
  const someOnPage = pageIds.some((id) => selectedSet.has(id))
  const toggleRow = (id: string, on: boolean) => {
    if (selectionMode === 'single') setSelected(on ? [id] : [])
    else setSelected(on ? [...selected.filter((x) => x !== id), id] : selected.filter((x) => x !== id))
  }

  // ---------- layout ----------

  const widthOf = (column: GridColumn<TData, TMeta>) => widths[columnKey(column)] ?? column.width ?? DEFAULT_WIDTH
  const anyFrozen = dataColumns.some((c) => c.frozen)
  const lead: { key: string; width: number }[] = [
    ...(showStatus ? [{ key: 'status', width: STATUS_WIDTH }] : []),
    ...(selectionMode !== 'none' ? [{ key: 'select', width: SELECT_WIDTH }] : []),
    ...(renderDetail ? [{ key: 'expand', width: EXPAND_WIDTH }] : []),
  ]
  const leadOffsets = new Map<string, number>()
  let offset = 0
  for (const l of lead) {
    leadOffsets.set(l.key, offset)
    offset += l.width
  }
  const frozenOffsets = new Map<string, number>()
  for (const c of dataColumns) {
    if (!c.frozen) continue
    frozenOffsets.set(columnKey(c), offset)
    offset += widthOf(c)
  }
  const totalWidth = lead.reduce((s, l) => s + l.width, 0) + dataColumns.reduce((s, c) => s + widthOf(c), 0)
  const stickyLead = (key: string): CSSProperties | undefined =>
    anyFrozen ? { position: 'sticky', left: leadOffsets.get(key), zIndex: 1 } : undefined
  const stickyCol = (c: GridColumn<TData, TMeta>): CSSProperties | undefined =>
    c.frozen ? { position: 'sticky', left: frozenOffsets.get(columnKey(c)), zIndex: 1 } : undefined

  const startResize = (event: ReactPointerEvent<HTMLSpanElement>, column: GridColumn<TData, TMeta>) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = widthOf(column)
    const min = column.minWidth ?? 48
    const onMove = (e: PointerEvent) => {
      setWidths((w) => ({ ...w, [columnKey(column)]: Math.max(min, startWidth + e.clientX - startX) }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const toggleSort = (column: GridColumn<TData, TMeta>) => {
    if (column.sortable === false) return
    const next: GridSort<TData> | null =
      sort?.field !== columnKey(column)
        ? { field: columnKey(column) as FieldOf<TData>, direction: 'asc' }
        : sort.direction === 'asc'
          ? { field: columnKey(column) as FieldOf<TData>, direction: 'desc' }
          : null
    setSort(next)
  }

  const hasAggregates = dataColumns.some((c) => c.aggregate)
  const showFooter = showFooterProp ?? hasAggregates
  const colCount = lead.length + dataColumns.length
  const anyErrors = [...errorsById.values()].some(Boolean)

  // ---------- render ----------

  const renderCell = (row: GridRow<TData, TMeta>, column: GridColumn<TData, TMeta>, r: number, c: number) => {
    const value = cellValue(column, row)
    const isActive = act.r === r && act.c === c
    const isEditing = editing?.rowId === row.id && editing.field === column.field
    const locked = !canEdit(row, column)
    const error = column.value ? undefined : errorsById.get(row.id)?.[column.field]
    const changed = !column.value && row.status === 'modified' && row.changedFields?.includes(column.field)
    const text = displayText(column, row, value, locale, currency)
    const label = `${columnLabel(column)}, row ${String(rowNumber.get(row.id) ?? r + 1)}`
    const original = changed && row.original ? displayText(column, row, row.original[column.field], locale, currency) : null
    const align = column.align ?? (column.editor === 'number' || column.editor === 'currency' ? 'end' : column.editor === 'checkbox' ? 'center' : 'start')

    return (
      <td
        key={columnKey(column)}
        role='gridcell'
        className='erp-data-grid__cell'
        {...cells.cellProps(r, c, isEditing)}
        data-field={column.field}
        data-changed={flag(changed)}
        data-editing={flag(isEditing)}
        data-align={align}
        data-frozen={flag(column.frozen)}
        style={stickyCol(column)}
        tabIndex={isActive && !isEditing ? 0 : -1}
        aria-colindex={lead.length + c + 1}
        aria-readonly={flag(locked)}
        aria-invalid={flag(error)}
        aria-label={isEditing ? undefined : `${label}${text ? `: ${text}` : ''}${error ? `, error: ${error}` : ''}`}
        title={error ?? (original !== null ? `Original: ${original || '(empty)'}` : undefined)}
        onDoubleClick={() => {
          startEdit({ r, c })
        }}
      >
        {isEditing ? (
          <GridCellEditor
            column={column}
            row={row}
            label={columnLabel(column)}
            value={editing.draft}
            seeded={editing.seeded}
            open={editing.open}
            locale={locale}
            onDraft={(draft) => {
              setEditing((e) => (e ? { ...e, draft } : e))
            }}
            commit={commitEdit}
            cancel={cancelEdit}
          />
        ) : column.editor === 'checkbox' ? (
          <span
            className='erp-data-grid__check'
            data-checked={flag(value)}
            aria-hidden='true'
            onClick={() => {
              if (!locked) setCell(row.id, column.field, !value)
            }}
          >
            {Boolean(value) && <Icon name='check' />}
          </span>
        ) : (
          <span className='erp-data-grid__text'>{column.render ? column.render(value, row) : text}</span>
        )}
        {!isEditing && cells.hasFillHandle(r, c) && <FillHandle onMouseDown={cells.startFill} />}
      </td>
    )
  }

  const renderRow = (row: GridRow<TData, TMeta>, r: number) => {
    const isSelected = selectedSet.has(row.id)
    const isExpanded = expanded.has(row.id)
    return (
      <Fragment key={row.id}>
        <tr
          role='row'
          className='erp-data-grid__row'
          data-status={row.status}
          aria-rowindex={(rowNumber.get(row.id) ?? r + 1) + 1}
          aria-selected={selectionMode !== 'none' ? isSelected : undefined}
          aria-expanded={renderDetail ? isExpanded : undefined}
        >
          {showStatus && (
            <td
              role='gridcell'
              className='erp-data-grid__status'
              style={stickyLead('status')}
              aria-label={statusLabel[row.status] || 'Unchanged'}
              title={statusLabel[row.status] || undefined}
            >
              {row.status !== 'unchanged' && <span className='erp-data-grid__marker' data-status={row.status} />}
            </td>
          )}
          {selectionMode !== 'none' && (
            <td
              role='gridcell'
              className='erp-data-grid__select'
              style={stickyLead('select')}
            >
              <Checkbox
                label={`Select row ${String(rowNumber.get(row.id) ?? r + 1)}`}
                hideLabel
                size='sm'
                value={isSelected}
                onChange={(on) => {
                  toggleRow(row.id, Boolean(on))
                }}
              />
            </td>
          )}
          {renderDetail && (
            <td
              role='gridcell'
              className='erp-data-grid__expand'
              style={stickyLead('expand')}
            >
              <button
                type='button'
                className='erp-input-action'
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                onClick={() => {
                  const next = new Set(expanded)
                  if (isExpanded) next.delete(row.id)
                  else next.add(row.id)
                  setExpanded(next)
                }}
              >
                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} />
              </button>
            </td>
          )}
          {dataColumns.map((column, c) => renderCell(row, column, r, c))}
        </tr>
        {renderDetail && isExpanded && (
          <tr
            role='row'
            className='erp-data-grid__detail-row'
          >
            <td
              role='gridcell'
              colSpan={colCount}
              className='erp-data-grid__detail'
            >
              {renderDetail(row)}
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  let rowIndex = 0
  const body: ReactNode[] = []
  if (visibleRows.length === 0 && (!groups || groups.length === 0)) {
    body.push(
      <tr
        key='empty'
        role='row'
      >
        <td
          role='gridcell'
          colSpan={colCount}
          className='erp-data-grid__empty'
        >
          {emptyText}
        </td>
      </tr>
    )
  } else if (groups) {
    for (const group of groups) {
      const isCollapsed = collapsed.has(group.key)
      const first = group.rows[0]
      const groupLabel =
        groupColumn && first ? displayText(groupColumn, first, cellValue(groupColumn, first), locale, currency) : group.key
      body.push(
        <tr
          key={`group-${group.key}`}
          role='row'
          className='erp-data-grid__group-row'
          aria-expanded={!isCollapsed}
        >
          <td
            role='gridcell'
            colSpan={lead.length + 1}
            className='erp-data-grid__group'
          >
            <button
              type='button'
              className='erp-data-grid__group-toggle'
              aria-expanded={!isCollapsed}
              onClick={() => {
                const next = new Set(collapsed)
                if (isCollapsed) next.delete(group.key)
                else next.add(group.key)
                setCollapsed(next)
              }}
            >
              <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} />
              {groupLabel || '(empty)'} <span className='erp-data-grid__group-count'>({group.rows.length})</span>
            </button>
          </td>
          {dataColumns.slice(1).map((column) => (
            <td
              key={columnKey(column)}
              role='gridcell'
              className='erp-data-grid__subtotal'
              data-align={column.editor === 'number' || column.editor === 'currency' ? 'end' : undefined}
            >
              {aggregate(column, group.rows, locale, currency)}
            </td>
          ))}
        </tr>
      )
      if (!isCollapsed) for (const row of group.rows) body.push(renderRow(row, rowIndex++))
    }
  } else {
    visibleRows.forEach((row, r) => body.push(renderRow(row, r)))
  }

  return (
    <div
      className={cx('erp-data-grid', className)}
      data-size={size}
      data-editable={flag(editable)}
      {...props}
    >
      {(toolbar != null || allowAdd || allowDelete || allowExport) && (
        <div
          className='erp-data-grid__toolbar'
          role='toolbar'
          aria-label={`${ariaLabel} actions`}
        >
          {toolbar}
          <span className='erp-data-grid__toolbar-spacer' />
          {allowAdd && editable && (
            <Button
              size='sm'
              icon={<Icon name='add' />}
              onClick={addRowBelow}
            >
              Add row
            </Button>
          )}
          {allowDelete && editable && (
            <Button
              size='sm'
              icon={<Icon name='trash' />}
              onClick={removeRows}
              disabled={visibleRows.length === 0}
            >
              {selected.length > 1 ? `Delete ${String(selected.length)} rows` : 'Delete row'}
            </Button>
          )}
          {allowExport && (
            <Button
              size='sm'
              icon={<Icon name='download' />}
              onClick={() => {
                downloadCsv(exportFileName, sortedRows, columns, { locale, currency })
              }}
            >
              Export CSV
            </Button>
          )}
        </div>
      )}
      {selectionMode === 'multiple' && allOnPage && pageSize && sortedRows.length > pageIds.length && (
        <div className='erp-data-grid__select-banner'>
          {selected.length >= sortedRows.length ? (
            <>
              All {sortedRows.length} rows are selected.{' '}
              <button
                type='button'
                onClick={() => {
                  setSelected([])
                }}
              >
                Clear selection
              </button>
            </>
          ) : (
            <>
              All {pageIds.length} rows on this page are selected.{' '}
              <button
                type='button'
                onClick={() => {
                  setSelected(sortedRows.map((r) => r.id))
                }}
              >
                Select all {sortedRows.length} rows
              </button>
            </>
          )}
        </div>
      )}
      <div
        className='erp-data-grid__scroller'
        style={height !== undefined ? { maxHeight: height } : undefined}
      >
        <table
          ref={tableRef}
          role='grid'
          className='erp-data-grid__table'
          aria-label={ariaLabel}
          aria-rowcount={liveRows.length + 1}
          aria-colcount={colCount}
          aria-multiselectable={selectionMode === 'multiple' || cells.multi || undefined}
          aria-readonly={flag(!editable)}
          style={{ width: totalWidth }}
          onKeyDown={handleKeyDown}
          onCopy={cells.onCopy}
          onCut={cells.onCut}
          onPaste={cells.onPaste}
        >
          <colgroup>
            {lead.map((l) => (
              <col
                key={l.key}
                style={{ width: l.width }}
              />
            ))}
            {dataColumns.map((c) => (
              <col
                key={columnKey(c)}
                style={{ width: widthOf(c) }}
              />
            ))}
          </colgroup>
          <thead>
            <tr
              role='row'
              aria-rowindex={1}
            >
              {showStatus && (
                <th
                  role='columnheader'
                  className='erp-data-grid__status'
                  style={stickyLead('status')}
                >
                  <span className='erp-visually-hidden'>Change status</span>
                </th>
              )}
              {selectionMode !== 'none' && (
                <th
                  role='columnheader'
                  className='erp-data-grid__select'
                  style={stickyLead('select')}
                >
                  {selectionMode === 'multiple' ? (
                    <Checkbox
                      label='Select all rows on this page'
                      hideLabel
                      size='sm'
                      value={allOnPage}
                      indeterminate={someOnPage && !allOnPage}
                      onChange={(on) => {
                        const rest = selected.filter((id) => !pageIds.includes(id))
                        setSelected(on ? [...rest, ...pageIds] : rest)
                      }}
                    />
                  ) : (
                    <span className='erp-visually-hidden'>Select</span>
                  )}
                </th>
              )}
              {renderDetail && (
                <th
                  role='columnheader'
                  className='erp-data-grid__expand'
                  style={stickyLead('expand')}
                >
                  <span className='erp-visually-hidden'>Details</span>
                </th>
              )}
              {dataColumns.map((column, c) => {
                const sorted = sort?.field === columnKey(column) ? sort.direction : null
                const sortable = column.sortable !== false
                return (
                  <th
                    key={columnKey(column)}
                    role='columnheader'
                    className='erp-data-grid__header'
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    data-frozen={flag(column.frozen)}
                    data-range-col={flag(cells.multi && cells.colSelected(c))}
                    data-required={flag(column.required)}
                    data-align={column.align ?? (column.editor === 'number' || column.editor === 'currency' ? 'end' : undefined)}
                    style={stickyCol(column)}
                  >
                    {sortable ? (
                      <button
                        type='button'
                        className='erp-data-grid__sort'
                        onClick={() => {
                          toggleSort(column)
                        }}
                      >
                        <span className='erp-data-grid__header-text'>{column.header}</span>
                        <Icon
                          name={sorted === 'asc' ? 'sort-asc' : sorted === 'desc' ? 'sort-desc' : 'sort'}
                          className='erp-data-grid__sort-icon'
                          data-sorted={flag(sorted)}
                        />
                      </button>
                    ) : (
                      <span className='erp-data-grid__header-text'>{column.header}</span>
                    )}
                    {column.required && (
                      <span
                        className='erp-data-grid__required'
                        aria-hidden='true'
                      >
                        *
                      </span>
                    )}
                    <span
                      className='erp-data-grid__resize'
                      aria-hidden='true'
                      onPointerDown={(event) => {
                        startResize(event, column)
                      }}
                    />
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>{body}</tbody>
          {showFooter && (
            <tfoot>
              <tr
                role='row'
                className='erp-data-grid__footer'
              >
                {lead.map((l, i) => (
                  <td
                    key={l.key}
                    role='gridcell'
                    style={stickyLead(l.key)}
                  >
                    {i === 0 && <span className='erp-visually-hidden'>Totals</span>}
                  </td>
                ))}
                {dataColumns.map((column, c) => (
                  <td
                    key={columnKey(column)}
                    role='gridcell'
                    className='erp-data-grid__total'
                    data-align={column.editor === 'number' || column.editor === 'currency' ? 'end' : undefined}
                    style={stickyCol(column)}
                  >
                    {c === 0 && !column.aggregate ? 'Total' : aggregate(column, liveRows, locale, currency)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className='erp-data-grid__statusbar'>
        <span
          role='status'
          aria-live='polite'
          className='erp-data-grid__message'
          data-tone={cells.message?.includes('could not') ? 'error' : undefined}
        >
          {cells.message}
        </span>
        <RangeSummaryText
          summary={cells.summary}
          locale={locale}
        />
        {anyErrors && editable && <span className='erp-data-grid__error-count'>Some cells have errors</span>}
        {pageSize && !groups && sortedRows.length > 0 && (
          <span className='erp-data-grid__pager'>
            <span>
              {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of{' '}
              {sortedRows.length}
            </span>
            <button
              type='button'
              className='erp-input-action'
              aria-label='Previous page'
              disabled={currentPage === 0}
              onClick={() => {
                setPage(currentPage - 1)
              }}
            >
              <Icon name='chevron-left' />
            </button>
            <button
              type='button'
              className='erp-input-action'
              aria-label='Next page'
              disabled={currentPage >= pageCount - 1}
              onClick={() => {
                setPage(currentPage + 1)
              }}
            >
              <Icon name='chevron-right' />
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
