/**
 * Parses tab-separated clipboard text the way Excel writes it: rows split on newlines, cells on
 * tabs, and quoted cells may contain tabs, newlines and doubled quotes (`""`).
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  let quoted = false
  const input = text.replace(/\r\n?/g, '\n')
  while (i < input.length) {
    const ch = input.charAt(i)
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"'
        i += 2
        continue
      }
      if (ch === '"') {
        quoted = false
        i++
        continue
      }
      cell += ch
      i++
      continue
    }
    if (ch === '"' && cell === '') {
      quoted = true
    } else if (ch === '\t') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
    i++
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/** Quotes a cell using Excel's rules when it contains a tab, newline or quote. */
export function quoteTsvCell(value: string): string {
  return /[\t\n\r"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toTsv(matrix: readonly (readonly string[])[]): string {
  return matrix.map((r) => r.map(quoteTsvCell).join('\t')).join('\n')
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** HTML table for programs that prefer `text/html` on the clipboard. */
export function toHtmlTable(matrix: readonly (readonly string[])[], headers?: readonly string[]): string {
  const head = headers ? `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>` : ''
  const body = matrix
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`)
    .join('')
  return `<table>${head}<tbody>${body}</tbody></table>`
}
