import { useCallback, useMemo, useState } from 'react'
import {
  acceptChanges as accept,
  createAddedRow,
  deleteRows as remove,
  getChanges as collect,
  rejectChanges as reject,
  revertCell as revertOneCell,
  toGridRows,
  validateRows,
} from './gridRows'
import type { FieldOf, GridChanges, GridColumn, GridRow, GridRowInput } from './types'

export interface UseGridRowsOptions<TData, TMeta> {
  /** Validate every row (not only edited ones), so `hasErrors` covers rows loaded with bad data. */
  columns?: readonly GridColumn<TData, TMeta>[]
}

export interface GridRowsApi<TData, TMeta> {
  /** Pass to `DataGrid rows`. */
  rows: GridRow<TData, TMeta>[]
  /** Pass to `DataGrid onRowsChange`. */
  setRows: (rows: GridRow<TData, TMeta>[]) => void
  /** Any row added, modified or deleted. */
  isDirty: boolean
  /** Any cell has a validation error. */
  hasErrors: boolean
  getChanges: () => GridChanges<TData, TMeta>
  /** After a successful save. Pass ids to accept only the rows the server confirmed. */
  acceptChanges: (ids?: readonly string[]) => void
  /** Revert rows to their original values. */
  rejectChanges: (ids?: readonly string[]) => void
  revertRow: (id: string) => void
  revertCell: (id: string, field: FieldOf<TData>) => void
  /** Replace a row's meta, e.g. with the id and version the server returned. Does not mark the row modified. */
  updateMeta: (id: string, meta: TMeta) => void
  addRow: (data: TData, meta: TMeta) => string
  deleteRows: (ids: readonly string[]) => void
}

/**
 * State and change tracking for a DataGrid. Holds the rows and exposes `getChanges()`,
 * `acceptChanges()` and the rest of the save workflow.
 */
export function useGridRows<TData, TMeta = undefined>(
  initial: readonly GridRowInput<TData, TMeta>[],
  options: UseGridRowsOptions<TData, TMeta> = {}
): GridRowsApi<TData, TMeta> {
  const { columns } = options
  const [rows, setRowsState] = useState<GridRow<TData, TMeta>[]>(() => {
    const loaded = toGridRows(initial)
    return columns ? validateRows(loaded, columns) : loaded
  })

  const setRows = useCallback((next: GridRow<TData, TMeta>[]) => {
    setRowsState(next)
  }, [])

  const update = useCallback(
    (fn: (rows: GridRow<TData, TMeta>[]) => GridRow<TData, TMeta>[]) => {
      setRowsState((prev) => {
        const next = fn(prev)
        return columns ? validateRows(next, columns) : next
      })
    },
    [columns]
  )

  const isDirty = useMemo(() => rows.some((r) => r.status !== 'unchanged'), [rows])
  const hasErrors = useMemo(
    () => rows.some((r) => r.status !== 'deleted' && r.errors && Object.values(r.errors).some(Boolean)),
    [rows]
  )

  return {
    rows,
    setRows,
    isDirty,
    hasErrors,
    getChanges: () => collect(rows),
    acceptChanges: (ids) => {
      update((prev) => accept(prev, ids))
    },
    rejectChanges: (ids) => {
      update((prev) => reject(prev, ids))
    },
    revertRow: (id) => {
      update((prev) => reject(prev, [id]))
    },
    revertCell: (id, field) => {
      update((prev) => prev.map((r) => (r.id === id ? revertOneCell(r, field) : r)))
    },
    updateMeta: (id, meta) => {
      setRowsState((prev) => prev.map((r) => (r.id === id ? { ...r, meta } : r)))
    },
    addRow: (data, meta) => {
      const row = createAddedRow(data, meta)
      update((prev) => [...prev, row])
      return row.id
    },
    deleteRows: (ids) => {
      update((prev) => remove(prev, ids))
    },
  }
}
