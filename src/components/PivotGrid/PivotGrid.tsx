import { useMemo, useRef, useState, type ComponentProps } from 'react'
import { RangeStatusBar, useCellRange } from '../../internal/cellRange'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { Icon } from '../Icon'
import { useLocale } from '../LocaleProvider'
import { aggregateLabel, pivot, type PivotConfig, type PivotRecord } from './pivot'
import '../../styles/base.css'
import './PivotGrid.css'

export interface PivotGridProps extends Omit<ComponentProps<'div'>, 'children'> {
  data: readonly PivotRecord[]
  config: PivotConfig
  /** Display names of fields. */
  fieldLabels?: Record<string, string>
  /** Number formatting of the values. */
  valueFormat?: Intl.NumberFormatOptions
  /** Show subtotal rows for outer row groups. */
  showSubtotals?: boolean
  showGrandTotals?: boolean
  'aria-label': string
}

interface ValueColumn {
  path: readonly string[]
  /** Index into `config.values`. */
  k: number
  total: boolean
}

/**
 * Cross-tab of records: row groups down the side, column groups across the top, aggregated
 * values in the cells, with collapsible row groups, subtotals and grand totals. Value cells
 * select like Excel (click, drag, Shift+arrows) and copy to Excel with Ctrl+C (Ctrl+Shift+C
 * includes the row and column headers).
 */
export function PivotGrid({
  data,
  config,
  fieldLabels = {},
  valueFormat,
  showSubtotals = true,
  showGrandTotals = true,
  className,
  'aria-label': ariaLabel,
  ...props
}: PivotGridProps) {
  const { locale } = useLocale()
  const result = useMemo(() => pivot(data, config, new Intl.Collator(locale, { numeric: true })), [data, config, locale])
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const tableRef = useRef<HTMLTableElement>(null)
  const fmt = (v: number | null) => (v === null ? '' : new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...valueFormat }).format(v))
  const name = (f: string) => fieldLabels[f] ?? f
  const depth = config.rows.length
  const colKeys = config.columns.length ? result.colKeys : [[]]
  const valueCount = Math.max(1, config.values.length)
  const withTotalColumns = showGrandTotals && config.columns.length > 0

  const visibleRows = result.rowKeys.filter((path) => {
    for (let i = 1; i < path.length; i++) if (collapsed.has(path.slice(0, i).join('/'))) return false
    if (path.length < depth && !showSubtotals && !collapsed.has(path.join('/'))) return false
    return true
  })

  const headerFor = (colPath: readonly string[]) => (colPath.length ? colPath.join(' / ') : 'Total')

  // The selectable value matrix: body rows, then the grand-total row; value columns, then totals.
  const gridRows: (readonly string[])[] = [...visibleRows, ...(showGrandTotals ? [[]] : [])]
  const gridCols: ValueColumn[] = [
    ...colKeys.flatMap((path) => Array.from({ length: valueCount }, (_, k) => ({ path, k, total: false }))),
    ...(withTotalColumns ? Array.from({ length: valueCount }, (_, k) => ({ path: [] as string[], k, total: true })) : []),
  ]
  const valueAt = (r: number, c: number): number | null => {
    const path = gridRows[r]
    const col = gridCols[c]
    if (!path || !col) return null
    return result.cell(path, col.path).values[col.k] ?? null
  }
  const columnTitle = (col: ValueColumn) => {
    const head = col.total ? 'Total' : headerFor(col.path)
    const value = config.values[col.k]
    return config.values.length > 1 && value ? `${head} – ${aggregateLabel(value, name(value.field))}` : head
  }

  const cells = useCellRange({
    rows: gridRows.length,
    cols: gridCols.length,
    gridRef: tableRef,
    getText: (r, c) => {
      const v = valueAt(r, c)
      return v === null ? '' : String(v)
    },
    getValue: valueAt,
    getHeader: (c) => {
      const col = gridCols[c]
      return col ? columnTitle(col) : ''
    },
    getRowHeader: (r) => {
      const path = gridRows[r]
      return path?.length ? path.join(' / ') : 'Grand total'
    },
  })

  const valueCell = (r: number, c: number, className?: string) => {
    const v = valueAt(r, c)
    const col = gridCols[c]
    const path = gridRows[r]
    const isActive = cells.active.r === r && cells.active.c === c
    const rowName = path?.length ? path.join(' / ') : 'Grand total'
    return (
      <td
        key={c}
        role='gridcell'
        className={className}
        tabIndex={isActive ? 0 : -1}
        aria-label={`${rowName}, ${col ? columnTitle(col) : ''}: ${fmt(v) || 'empty'}`}
        {...cells.cellProps(r, c)}
      >
        {fmt(v)}
      </td>
    )
  }

  const valueCells = (r: number) =>
    gridCols.map((col, c) => valueCell(r, c, col.total ? 'erp-pivot-grid__total' : undefined))

  return (
    <div
      className={cx('erp-pivot-grid', className)}
      {...props}
    >
      <div className='erp-pivot-grid__scroller'>
        <table
          ref={tableRef}
          role='grid'
          aria-label={ariaLabel}
          aria-readonly='true'
          aria-multiselectable='true'
          onKeyDown={(event) => {
            if ((event.target as HTMLElement).hasAttribute('data-cell')) cells.onKeyDown(event)
          }}
          onCopy={cells.onCopy}
          onCut={cells.onCut}
        >
          <thead>
            <tr role='row'>
              <th
                role='columnheader'
                scope='col'
                rowSpan={config.values.length > 1 ? 2 : 1}
              >
                {config.rows.map(name).join(' / ') || 'Rows'}
              </th>
              {colKeys.map((cp) => (
                <th
                  key={cp.join('/') || 'all'}
                  role='columnheader'
                  scope='colgroup'
                  colSpan={valueCount}
                >
                  {headerFor(cp)}
                </th>
              ))}
              {withTotalColumns && (
                <th
                  role='columnheader'
                  scope='colgroup'
                  colSpan={valueCount}
                  className='erp-pivot-grid__total'
                >
                  Total
                </th>
              )}
            </tr>
            {config.values.length > 1 && (
              <tr role='row'>
                {gridCols.map((col, c) => {
                  const v = config.values[col.k]
                  return (
                    <th
                      key={`${col.path.join('/')}-${String(col.total)}-${String(col.k)}`}
                      role='columnheader'
                      scope='col'
                      data-range-col={flag(cells.multi && cells.colSelected(c))}
                    >
                      {v ? aggregateLabel(v, name(v.field)) : ''}
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {visibleRows.map((path, r) => {
              const key = path.join('/')
              const isGroup = path.length < depth
              const isCollapsed = collapsed.has(key)
              return (
                <tr
                  key={key}
                  role='row'
                  data-subtotal={flag(isGroup)}
                  data-level={path.length}
                >
                  <th
                    role='rowheader'
                    scope='row'
                    style={{ paddingInlineStart: `${String((path.length - 1) * 1.25 + 0.5)}rem` }}
                  >
                    {isGroup ? (
                      <button
                        type='button'
                        className='erp-pivot-grid__toggle'
                        aria-expanded={!isCollapsed}
                        onClick={() => {
                          const next = new Set(collapsed)
                          if (isCollapsed) next.delete(key)
                          else next.add(key)
                          setCollapsed(next)
                        }}
                      >
                        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} />
                        {path[path.length - 1]}
                      </button>
                    ) : (
                      path[path.length - 1]
                    )}
                  </th>
                  {valueCells(r)}
                </tr>
              )
            })}
          </tbody>
          {showGrandTotals && (
            <tfoot>
              <tr role='row'>
                <th
                  role='rowheader'
                  scope='row'
                >
                  Grand total
                </th>
                {valueCells(visibleRows.length)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {data.length === 0 && <p className='erp-empty'>No data</p>}
      <RangeStatusBar
        message={cells.message}
        summary={cells.summary}
        locale={locale}
      />
    </div>
  )
}
