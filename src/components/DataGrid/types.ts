import type { ReactNode } from 'react'
import type { ParseResult } from '../../utils/number'
import type { Key, Option } from '../../utils/types'
import type { LookupColumn, LookupDataSource } from '../Lookup'

/** Change state of a row. Set by the grid; never set it yourself except when loading rows. */
export type RowStatus = 'unchanged' | 'added' | 'modified' | 'deleted'

/** A field name of the row data. */
export type FieldOf<TData> = Extract<keyof TData, string>

/**
 * One grid row.
 *
 * ```ts
 * type GridRow<TData, TMeta> = {
 *   id: string        // stable key; new rows get a temporary id
 *   data: TData       // values shown and edited in cells
 *   meta: TMeta       // your data: never displayed, copied or edited by the grid
 *   status: RowStatus // 'unchanged' | 'added' | 'modified' | 'deleted'
 *   original?: TData  // snapshot from load / last acceptChanges
 *   changedFields?: (keyof TData)[]
 *   errors?: Partial<Record<keyof TData, string>>
 * }
 * ```
 */
export interface GridRow<TData, TMeta = undefined> {
  id: string
  data: TData
  meta: TMeta
  status: RowStatus
  original?: TData
  changedFields?: FieldOf<TData>[]
  errors?: Partial<Record<FieldOf<TData>, string>>
}

/** What you pass in when loading rows: status defaults to `unchanged` and `original` to `data`. */
export interface GridRowInput<TData, TMeta = undefined> {
  id: string
  data: TData
  meta: TMeta
  status?: RowStatus
  original?: TData
}

export type GridEditorType = 'text' | 'number' | 'currency' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'lookup'

/** Props passed to a custom `renderEditor`. */
export interface GridEditorProps<TData, TMeta = undefined> {
  value: unknown
  onChange: (value: unknown) => void
  row: GridRow<TData, TMeta>
  column: GridColumn<TData, TMeta>
  /** Commit the current (or given) value and leave edit mode. */
  commit: (value?: unknown) => void
  /** Leave edit mode without changing the cell. */
  cancel: () => void
}

export type GridAggregate = 'sum' | 'count' | 'avg' | 'min' | 'max'

/**
 * Column definition.
 *
 * ```ts
 * { field, header, editor?, options?, lookup?, readOnly?, required?, validate?, format?,
 *   parse?, copyAs?, width?, minWidth?, frozen?, align?, precision?, currency?, sortable?,
 *   aggregate?, render?, renderEditor? }
 * ```
 */
export interface GridColumn<TData, TMeta = undefined> {
  /** Which value the column shows and edits. */
  field: FieldOf<TData>
  /** Unique column id when two columns use the same field (computed columns). Defaults to `field`. */
  id?: string
  /** Computed, display-only value (e.g. qty × price). Used for display, copy, sort and totals. */
  value?: (row: GridRow<TData, TMeta>) => unknown
  header: ReactNode
  /** Plain-text name for screen readers and copied headers. Defaults to `header` when it is a string. */
  label?: string
  /** Editor type. Omit for a display-only column. */
  editor?: GridEditorType
  /** Options for `select` / `multiselect`, or `(row) => options` for cascading lists. */
  options?: readonly Option<Key>[] | ((row: GridRow<TData, TMeta>) => readonly Option<Key>[])
  /** Data source for `lookup` columns. */
  lookup?: LookupDataSource<unknown, Key>
  /** Result columns for the lookup editor dropdown. */
  lookupColumns?: LookupColumn<unknown>[]
  /** Lock the cell, e.g. `(row) => row.meta.posted`. */
  readOnly?: boolean | ((row: GridRow<TData, TMeta>) => boolean)
  /** Empty value shows a cell error. */
  required?: boolean
  /** Return an error message for an invalid value. */
  validate?: (value: unknown, row: GridRow<TData, TMeta>) => string | undefined
  /** Display text. Also used for copy when `copyAs: 'display'`. */
  format?: (value: unknown, row: GridRow<TData, TMeta>) => string
  /** Custom cell content (display only). */
  render?: (value: unknown, row: GridRow<TData, TMeta>) => ReactNode
  /** Converts pasted text. Defaults per editor type. */
  parse?: (text: string, row: GridRow<TData, TMeta>) => ParseResult<unknown>
  /** What goes to the clipboard. Default: `value` for numbers, dates and checkboxes; `display` for selects and lookups. */
  copyAs?: 'value' | 'display'
  /** Custom editor. */
  renderEditor?: (props: GridEditorProps<TData, TMeta>) => ReactNode
  width?: number
  minWidth?: number
  /** Stick to the left while scrolling horizontally. */
  frozen?: boolean
  hidden?: boolean
  align?: 'start' | 'center' | 'end'
  /** Number editor: max decimals. */
  precision?: number
  min?: number
  max?: number
  /** Currency editor: ISO code (defaults to the LocaleProvider currency). */
  currency?: string
  /** Click the header to sort. Defaults to true. */
  sortable?: boolean
  /** Footer total and group subtotal. */
  aggregate?: GridAggregate | ((rows: GridRow<TData, TMeta>[]) => ReactNode)
}

export interface GridChanges<TData, TMeta = undefined> {
  added: { id: string; data: TData; meta: TMeta }[]
  modified: { id: string; data: TData; meta: TMeta; original: TData; changedFields: FieldOf<TData>[] }[]
  deleted: { id: string; original: TData; meta: TMeta }[]
}

export interface GridSort<TData> {
  field: FieldOf<TData>
  direction: 'asc' | 'desc'
}
