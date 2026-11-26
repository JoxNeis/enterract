import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { FillHandle, RangeStatusBar, useCellRange, type CellRange, type CellWrite } from '../../internal/cellRange'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { formatNumber, parseNumber, roundTo } from '../../utils/number'
import { toText } from '../../utils/text'
import type { Size } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { NumberField } from '../NumberField'
import { Spinner } from '../Spinner'
import { TextField } from '../TextField'
import './TreeGrid.css'

export interface TreeGridRow<T> {
  id: string
  data: T
  children?: TreeGridRow<T>[]
  /** Children are loaded with `loadChildren` on first expand. */
  hasChildren?: boolean
}

export interface TreeGridColumn<T> {
  field: Extract<keyof T, string>
  header: ReactNode
  /** Plain-text name for screen readers (defaults to `header` when it's a string). */
  label?: string
  width?: number
  align?: 'start' | 'end'
  /** `number` values are formatted by locale. */
  type?: 'text' | 'number'
  precision?: number
  format?: (value: unknown, row: TreeGridRow<T>) => string
  /** Inline editor. */
  editor?: 'text' | 'number'
  readOnly?: (row: TreeGridRow<T>) => boolean
  /** Parent rows show the sum of their descendants. */
  rollup?: 'sum'
}

export interface TreeGridCellChange<T> {
  rowId: string
  field: Extract<keyof T, string>
  value: unknown
}

export interface TreeGridProps<T> extends Omit<ComponentProps<'div'>, 'onChange'> {
  rows: readonly TreeGridRow<T>[]
  columns: readonly TreeGridColumn<T>[]
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  onExpandedChange?: (ids: string[]) => void
  loadChildren?: (row: TreeGridRow<T>) => Promise<TreeGridRow<T>[]>
  /** Called when an inline edit is committed. */
  onCellChange?: (rowId: string, field: Extract<keyof T, string>, value: unknown) => void
  /**
   * Called once with every cell an edit, paste, fill or clear changed. Use it when several cells
   * change together; without it `onCellChange` is called for each cell.
   */
  onCellsChange?: (changes: TreeGridCellChange<T>[]) => void
  /** Extra cell at the end of each row (row actions). */
  renderActions?: (row: TreeGridRow<T>, level: number) => ReactNode
  actionsHeader?: string
  'aria-label': string
  size?: Size
}

interface Flat<T> {
  row: TreeGridRow<T>
  level: number
  parentId: string | null
  expandable: boolean
}

/**
 * Hierarchical grid (WAI-ARIA treegrid): bill of materials, cost center hierarchy, project
 * breakdown. Arrows move between cells; Right/Left on the first column expand/collapse;
 * Enter or F2 edits; parents can roll up sums of their children. Cells select like Excel (drag,
 * Shift+click, Shift+arrows) and copy, cut, paste and fill with Ctrl+C / X / V, Ctrl+D / R.
 */
export function TreeGrid<T>({
  rows,
  columns,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  loadChildren,
  onCellChange,
  onCellsChange,
  renderActions,
  actionsHeader = 'Actions',
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  ...props
}: TreeGridProps<T>) {
  const { locale } = useLocale()
  const [open, setOpen] = useControllableState<readonly string[]>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange ? (ids) => { onExpandedChange([...ids]) } : undefined,
  })
  const [loaded, setLoaded] = useState<ReadonlyMap<string, TreeGridRow<T>[]>>(new Map())
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set())
  const [editing, setEditing] = useState<{ id: string; field: string; draft: unknown } | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const openSet = new Set(open)

  const childrenOf = (row: TreeGridRow<T>) => row.children ?? loaded.get(row.id)
  const flat: Flat<T>[] = []
  const walk = (list: readonly TreeGridRow<T>[], level: number, parentId: string | null) => {
    for (const row of list) {
      const kids = childrenOf(row)
      const expandable = Boolean(kids?.length) || (row.hasChildren === true && !kids)
      flat.push({ row, level, parentId, expandable })
      if (expandable && openSet.has(row.id) && kids) walk(kids, level + 1, row.id)
    }
  }
  walk(rows, 1, null)

  const colCount = columns.length + (renderActions ? 1 : 0)

  const rollup = (row: TreeGridRow<T>, field: Extract<keyof T, string>): number | null => {
    const kids = childrenOf(row)
    if (!kids?.length) {
      const v = row.data[field] as unknown
      return typeof v === 'number' ? v : null
    }
    return kids.reduce<number | null>((sum, k) => {
      const v = rollup(k, field)
      return v === null ? sum : (sum ?? 0) + v
    }, null)
  }

  const setExpanded = (item: Flat<T>, value: boolean) => {
    const id = item.row.id
    if (value === openSet.has(id)) return
    setOpen(value ? [...open, id] : open.filter((x) => x !== id))
    if (value && !childrenOf(item.row) && item.row.hasChildren && loadChildren) {
      setLoading((s) => new Set(s).add(id))
      loadChildren(item.row)
        .then((kids) => {
          setLoaded((m) => new Map(m).set(id, kids))
        })
        .catch(() => {
          setLoaded((m) => new Map(m).set(id, []))
        })
        .finally(() => {
          setLoading((s) => {
            const next = new Set(s)
            next.delete(id)
            return next
          })
        })
    }
  }

  const editable = onCellChange !== undefined || onCellsChange !== undefined
  const canEdit = (item: Flat<T> | undefined, column: TreeGridColumn<T> | undefined) =>
    Boolean(item && column?.editor && editable && !column.readOnly?.(item.row) && !(column.rollup && item.expandable))

  const applyChanges = (changes: TreeGridCellChange<T>[]) => {
    if (!changes.length) return
    if (onCellsChange) onCellsChange(changes)
    else for (const ch of changes) onCellChange?.(ch.rowId, ch.field, ch.value)
  }

  const display = (item: Flat<T>, column: TreeGridColumn<T>) => {
    const raw = column.rollup && item.expandable ? rollup(item.row, column.field) : (item.row.data[column.field] as unknown)
    if (column.format) return column.format(raw, item.row)
    if (raw === null || raw === undefined) return ''
    if (typeof raw === 'number' || column.type === 'number')
      return formatNumber(Number(raw), locale, { maximumFractionDigits: column.precision, minimumFractionDigits: column.precision })
    return toText(raw)
  }

  const rawValue = (item: Flat<T>, column: TreeGridColumn<T>): unknown =>
    column.rollup && item.expandable ? rollup(item.row, column.field) : (item.row.data[column.field])

  const writeCells = (targets: CellWrite[]) => {
    const changes: TreeGridCellChange<T>[] = []
    let failed = 0
    for (const t of targets) {
      const item = flat[t.r]
      const column = columns[t.c]
      if (!item || !column || !canEdit(item, column)) continue
      let value: unknown
      if (column.editor === 'number') {
        if (typeof t.value === 'number') value = t.value
        else {
          const parsed = parseNumber(t.text, locale)
          if (!parsed.ok) {
            failed += 1
            continue
          }
          value = parsed.value
        }
        if (typeof value === 'number') value = roundTo(value, column.precision ?? 10)
      } else value = t.text === '' ? null : t.text
      changes.push({ rowId: item.row.id, field: column.field, value })
    }
    applyChanges(changes)
    return { written: changes.length, failed }
  }

  const clearCells = (range: CellRange) => {
    const changes: TreeGridCellChange<T>[] = []
    for (let r = range.r0; r <= range.r1; r++)
      for (let c = range.c0; c <= range.c1; c++) {
        const item = flat[r]
        const column = columns[c]
        if (item && column && canEdit(item, column) && rawValue(item, column) != null)
          changes.push({ rowId: item.row.id, field: column.field, value: null })
      }
    applyChanges(changes)
  }

  const cells = useCellRange({
    rows: flat.length,
    cols: colCount,
    gridRef: tableRef,
    blocked: editing !== null,
    getText: (r, c) => {
      const item = flat[r]
      const column = columns[c]
      if (!item || !column) return ''
      const raw = rawValue(item, column)
      return typeof raw === 'number' && !column.format ? String(raw) : display(item, column)
    },
    getValue: (r, c) => {
      const item = flat[r]
      const column = columns[c]
      return item && column ? rawValue(item, column) : null
    },
    getHeader: (c) => {
      const column = columns[c]
      if (!column) return ''
      return column.label ?? (typeof column.header === 'string' ? column.header : column.field)
    },
    write: editable ? writeCells : undefined,
    clear: editable ? clearCells : undefined,
  })
  const act = cells.active
  const move = (r: number, c: number) => {
    cells.move(r, c)
  }

  const startEdit = () => {
    const item = flat[act.r]
    const column = columns[act.c]
    if (!item || !column || !canEdit(item, column)) return
    setEditing({ id: item.row.id, field: column.field, draft: item.row.data[column.field] })
  }

  const commit = (move: boolean) => {
    if (!editing) return
    applyChanges([{ rowId: editing.id, field: editing.field as Extract<keyof T, string>, value: editing.draft }])
    setEditing(null)
    cells.requestFocus()
    if (move) cells.setActive({ r: Math.min(act.r + 1, flat.length - 1), c: act.c })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing || event.defaultPrevented) return
    const item = flat[act.r]
    if (!item) return
    const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey
    let handled = true
    if (plain && act.c === 0 && event.key === 'ArrowRight' && item.expandable && !openSet.has(item.row.id)) setExpanded(item, true)
    else if (plain && act.c === 0 && event.key === 'ArrowLeft') {
      if (item.expandable && openSet.has(item.row.id)) setExpanded(item, false)
      else if (item.parentId) move(flat.findIndex((f) => f.row.id === item.parentId), 0)
    } else if (plain && (event.key === 'Enter' || event.key === 'F2')) {
      if (act.c === 0 && item.expandable && !canEdit(item, columns[0])) setExpanded(item, !openSet.has(item.row.id))
      else startEdit()
    } else handled = false
    if (handled) {
      event.preventDefault()
      return
    }
    // Arrows, Shift/Ctrl+arrows, Home/End, Ctrl+A, Delete, Ctrl+D / Ctrl+R, Ctrl+Shift+C.
    cells.onKeyDown(event)
  }

  return (
    <div
      className={cx('erp-tree-grid', className)}
      data-size={size}
      {...props}
    >
      <table
        ref={tableRef}
        role='treegrid'
        aria-label={ariaLabel}
        aria-rowcount={flat.length + 1}
        aria-multiselectable='true'
        className='erp-tree-grid__table'
        onKeyDown={onKeyDown}
        onCopy={cells.onCopy}
        onCut={cells.onCut}
        onPaste={cells.onPaste}
      >
        <thead>
          <tr role='row'>
            {columns.map((c) => (
              <th
                key={c.field}
                role='columnheader'
                style={c.width ? { width: c.width } : undefined}
                data-align={c.align ?? (c.type === 'number' || c.editor === 'number' ? 'end' : undefined)}
              >
                {c.header}
              </th>
            ))}
            {renderActions && (
              <th role='columnheader'>
                <span className='erp-visually-hidden'>{actionsHeader}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {flat.map((item, r) => {
            const isOpen = openSet.has(item.row.id)
            return (
              <tr
                key={item.row.id}
                role='row'
                aria-level={item.level}
                aria-expanded={item.expandable ? isOpen : undefined}
                aria-busy={flag(loading.has(item.row.id))}
                className='erp-tree-grid__row'
                data-parent={flag(item.expandable)}
              >
                {columns.map((column, c) => {
                  const isEditing = editing?.id === item.row.id && editing.field === column.field
                  const label = column.label ?? (typeof column.header === 'string' ? column.header : column.field)
                  const text = display(item, column)
                  return (
                    <td
                      key={column.field}
                      role='gridcell'
                      {...cells.cellProps(r, c, isEditing)}
                      data-align={column.align ?? (column.type === 'number' || column.editor === 'number' ? 'end' : undefined)}
                      aria-readonly={flag(!canEdit(item, column))}
                      aria-label={isEditing ? undefined : `${label}: ${text}`}
                      tabIndex={act.r === r && act.c === c && !isEditing ? 0 : -1}
                      className='erp-tree-grid__cell'
                      style={c === 0 ? { paddingInlineStart: `${String((item.level - 1) * 1.25 + 0.25)}rem` } : undefined}
                      onDoubleClick={() => {
                        cells.setActive({ r, c })
                        if (canEdit(item, column)) setEditing({ id: item.row.id, field: column.field, draft: item.row.data[column.field] })
                      }}
                    >
                      {c === 0 && (
                        <span
                          className='erp-tree-grid__toggle'
                          aria-hidden='true'
                          onClick={(event) => {
                            event.stopPropagation()
                            if (item.expandable) setExpanded(item, !isOpen)
                          }}
                        >
                          {loading.has(item.row.id) ? (
                            <Spinner
                              size='sm'
                              label={null}
                            />
                          ) : item.expandable ? (
                            <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} />
                          ) : null}
                        </span>
                      )}
                      {isEditing ? (
                        <span
                          className='erp-tree-grid__editor'
                          onKeyDown={(event) => {
                            if (event.defaultPrevented) return
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              commit(true)
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              setEditing(null)
                              cells.requestFocus()
                            }
                          }}
                          onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) commit(false)
                          }}
                        >
                          {column.editor === 'number' ? (
                            <NumberField
                              label={label}
                              hideLabel
                              size='sm'
                              autoFocus
                              precision={column.precision}
                              value={(editing.draft as number | null | undefined) ?? null}
                              onChange={(v) => {
                                setEditing({ ...editing, draft: v === null ? null : roundTo(v, column.precision ?? 10) })
                              }}
                            />
                          ) : (
                            <TextField
                              label={label}
                              hideLabel
                              size='sm'
                              autoFocus
                              value={(editing.draft as string | null | undefined) ?? null}
                              onChange={(v) => {
                                setEditing({ ...editing, draft: v })
                              }}
                            />
                          )}
                        </span>
                      ) : (
                        <span className='erp-tree-grid__text'>{text}</span>
                      )}
                      {!isEditing && cells.hasFillHandle(r, c) && <FillHandle onMouseDown={cells.startFill} />}
                    </td>
                  )
                })}
                {renderActions && (
                  <td
                    role='gridcell'
                    {...cells.cellProps(r, columns.length)}
                    tabIndex={act.r === r && act.c === columns.length ? 0 : -1}
                    className='erp-tree-grid__actions'
                  >
                    {renderActions(item.row, item.level)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <RangeStatusBar
        message={cells.message}
        summary={cells.summary}
        locale={locale}
      />
    </div>
  )
}
