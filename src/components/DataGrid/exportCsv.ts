import { cellValue, columnLabel, copyText } from './format'
import type { GridColumn, GridRow } from './types'

export interface ExportCsvOptions {
  locale?: string
  currency?: string
  /** Field separator. Use `;` for locales where Excel expects it (de-DE, fr-FR). */
  separator?: string
  /** Prepend a UTF-8 BOM so Excel opens accented text correctly. */
  bom?: boolean
}

const quote = (value: string, sep: string) =>
  value.includes(sep) || /[\n\r"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

/** Whole-grid CSV (visible columns, non-deleted rows). `meta` is never exported. */
export function toCsv<TData, TMeta>(
  rows: readonly GridRow<TData, TMeta>[],
  columns: readonly GridColumn<TData, TMeta>[],
  { locale = 'en-US', currency = 'USD', separator = ',', bom = true }: ExportCsvOptions = {}
): string {
  const visible = columns.filter((c) => !c.hidden)
  const lines = [visible.map((c) => quote(columnLabel(c), separator)).join(separator)]
  for (const row of rows) {
    if (row.status === 'deleted') continue
    lines.push(
      visible.map((c) => quote(copyText(c, row, cellValue(c, row), locale, currency), separator)).join(separator)
    )
  }
  return (bom ? '\ufeff' : '') + lines.join('\r\n')
}

/** Downloads the grid as a CSV file. */
export function downloadCsv<TData, TMeta>(
  filename: string,
  rows: readonly GridRow<TData, TMeta>[],
  columns: readonly GridColumn<TData, TMeta>[],
  options?: ExportCsvOptions
) {
  const blob = new Blob([toCsv(rows, columns, options)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
