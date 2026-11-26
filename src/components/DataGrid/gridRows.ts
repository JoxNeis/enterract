import type { FieldOf, GridChanges, GridColumn, GridRow, GridRowInput } from './types'

/** Value equality for cell values (primitives, arrays, plain objects). */
export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
}

/** Normalizes loaded rows: status `unchanged`, `original` = a copy of `data`. */
export function toGridRows<TData, TMeta>(inputs: readonly GridRowInput<TData, TMeta>[]): GridRow<TData, TMeta>[] {
  return inputs.map((r) => {
    if (r.status && (r.original || r.status === 'added')) return r as GridRow<TData, TMeta>
    return { ...r, status: r.status ?? 'unchanged', original: r.original ?? { ...r.data } }
  })
}

export function isCellReadOnly<TData, TMeta>(column: GridColumn<TData, TMeta>, row: GridRow<TData, TMeta>): boolean {
  return typeof column.readOnly === 'function' ? column.readOnly(row) : Boolean(column.readOnly)
}

/** Errors for one row from the columns' `required` and `validate`. */
export function validateRow<TData, TMeta>(
  row: GridRow<TData, TMeta>,
  columns: readonly GridColumn<TData, TMeta>[]
): Partial<Record<FieldOf<TData>, string>> | undefined {
  if (row.status === 'deleted') return undefined
  const errors: Partial<Record<FieldOf<TData>, string>> = {}
  for (const column of columns) {
    if (column.value) continue
    const value = row.data[column.field]
    if (column.required && isEmptyValue(value)) errors[column.field] = 'Required'
    else {
      const message = column.validate?.(value, row)
      if (message) errors[column.field] = message
    }
  }
  return Object.keys(errors).length ? errors : undefined
}

/** Recomputes `errors` for every row. */
export function validateRows<TData, TMeta>(
  rows: readonly GridRow<TData, TMeta>[],
  columns: readonly GridColumn<TData, TMeta>[]
): GridRow<TData, TMeta>[] {
  return rows.map((row) => {
    const errors = validateRow(row, columns)
    if (!errors && !row.errors) return row
    return { ...row, errors }
  })
}

/** Status and changed fields after the data changed, comparing with `original` by value. */
function track<TData, TMeta>(row: GridRow<TData, TMeta>, data: TData): GridRow<TData, TMeta> {
  if (row.status === 'added') return { ...row, data }
  const original = row.original ?? row.data
  const changedFields = (Object.keys(data as object) as FieldOf<TData>[]).filter(
    (f) => !sameValue(data[f], original[f])
  )
  return {
    ...row,
    data,
    original,
    status: changedFields.length ? 'modified' : 'unchanged',
    changedFields: changedFields.length ? changedFields : undefined,
  }
}

/** Sets one cell and updates the row's change tracking. */
export function updateCell<TData, TMeta>(
  row: GridRow<TData, TMeta>,
  field: FieldOf<TData>,
  value: unknown
): GridRow<TData, TMeta> {
  if (sameValue(row.data[field], value)) return row
  return track(row, { ...row.data, [field]: value })
}

/** Merges data into a row and updates its tracking. */
export function updateRowData<TData, TMeta>(row: GridRow<TData, TMeta>, data: Partial<TData>): GridRow<TData, TMeta> {
  return track(row, { ...row.data, ...data })
}

let tempCounter = 0

/** Temporary id for a new row (`new-1`, `new-2`…). */
export function nextTempId(): string {
  tempCounter += 1
  return `new-${String(tempCounter)}`
}

export function createAddedRow<TData, TMeta>(data: TData, meta: TMeta, id = nextTempId()): GridRow<TData, TMeta> {
  return { id, data, meta, status: 'added' }
}

/** Added rows are removed; other rows are flagged `deleted` so they can be restored. */
export function deleteRows<TData, TMeta>(rows: readonly GridRow<TData, TMeta>[], ids: readonly string[]) {
  const set = new Set(ids)
  return rows
    .filter((r) => !(set.has(r.id) && r.status === 'added'))
    .map((r) => (set.has(r.id) ? { ...r, status: 'deleted' as const, errors: undefined } : r))
}

/** What to send to the API: added, modified (with changed fields) and deleted rows, each with its meta. */
export function getChanges<TData, TMeta>(rows: readonly GridRow<TData, TMeta>[]): GridChanges<TData, TMeta> {
  const changes: GridChanges<TData, TMeta> = { added: [], modified: [], deleted: [] }
  for (const r of rows) {
    if (r.status === 'added') changes.added.push({ id: r.id, data: r.data, meta: r.meta })
    else if (r.status === 'modified')
      changes.modified.push({
        id: r.id,
        data: r.data,
        meta: r.meta,
        original: r.original ?? r.data,
        changedFields: r.changedFields ?? [],
      })
    else if (r.status === 'deleted') changes.deleted.push({ id: r.id, original: r.original ?? r.data, meta: r.meta })
  }
  return changes
}

const pick = (ids?: readonly string[]) => (ids ? new Set(ids) : null)

/** After a successful save: current values become the new original; deleted rows are dropped. */
export function acceptChanges<TData, TMeta>(rows: readonly GridRow<TData, TMeta>[], ids?: readonly string[]) {
  const set = pick(ids)
  return rows
    .filter((r) => !(r.status === 'deleted' && (!set || set.has(r.id))))
    .map((r) =>
      (!set || set.has(r.id)) && r.status !== 'unchanged'
        ? { ...r, status: 'unchanged' as const, original: { ...r.data }, changedFields: undefined }
        : r
    )
}

/** Reverts rows to their original values; added rows are removed. */
export function rejectChanges<TData, TMeta>(rows: readonly GridRow<TData, TMeta>[], ids?: readonly string[]) {
  const set = pick(ids)
  return rows
    .filter((r) => !(r.status === 'added' && (!set || set.has(r.id))))
    .map((r) =>
      (!set || set.has(r.id)) && r.status !== 'unchanged'
        ? { ...r, status: 'unchanged' as const, data: { ...(r.original ?? r.data) }, changedFields: undefined }
        : r
    )
}

export function revertCell<TData, TMeta>(row: GridRow<TData, TMeta>, field: FieldOf<TData>): GridRow<TData, TMeta> {
  if (!row.original) return row
  return updateCell(row, field, row.original[field])
}
