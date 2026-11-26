import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent, type RefObject } from 'react'
import { toHtmlTable, toTsv, parseTsv } from '../../utils/tsv'
import {
  edgesOf,
  extendFill,
  fillShortcut,
  fillTargets,
  inRange,
  pastedRange,
  pasteTargets,
  rangeSize,
  summarize,
  toRange,
  type CellPos,
  type CellRange,
  type CellWrite,
  type RangeSummary,
  type WriteResult,
} from './rangeOps'
import './cellRange.css'

export interface UseCellRangeOptions {
  /** Number of navigable rows and columns. */
  rows: number
  cols: number
  /** The grid element; cells are found by their `data-cell="r:c"` attribute. */
  gridRef: RefObject<HTMLElement | null>
  /** Clipboard text of a cell. */
  getText: (r: number, c: number) => string
  /** Raw value of a cell (fill and the Sum/Count/Average summary). Defaults to `getText`. */
  getValue?: (r: number, c: number) => unknown
  /** Column header text for Ctrl+Shift+C. */
  getHeader?: (c: number) => string
  /** Row header text for Ctrl+Shift+C (pivot-style grids). */
  getRowHeader?: (r: number) => string
  /** Writes pasted or filled cells. Omit for read-only grids (copy still works). */
  write?: (targets: CellWrite[], kind: 'paste' | 'fill') => WriteResult
  /** Clears the cells of a range (Delete, Backspace, Ctrl+X). */
  clear?: (range: CellRange) => void
  /** True while a cell editor is open: keys and clipboard events belong to the editor. */
  blocked?: boolean
}

const plural = (n: number, word = 'cell') => `${String(n)} ${word}${n === 1 ? '' : 's'}`
const INTERACTIVE = 'button, a[href], input, select, textarea, label, [contenteditable="true"], [role="checkbox"]'
const SUMMARY_LIMIT = 50_000

/**
 * Excel-style cell selection shared by the grids: click, Shift+click and drag to select;
 * Shift+arrows, Ctrl+arrows, Ctrl+A, Shift+Space (row) and Ctrl+Space (column); Ctrl+C / Ctrl+X /
 * Ctrl+V with Excel; the fill handle, Ctrl+D and Ctrl+R; Delete to clear; Escape to drop the
 * copy marker. Grids supply how to read and write a cell.
 */
export function useCellRange({ rows, cols, gridRef, getText, getValue, getHeader, getRowHeader, write, clear, blocked = false }: UseCellRangeOptions) {
  const [activeState, setActiveState] = useState<CellPos>({ r: 0, c: 0 })
  const [anchor, setAnchor] = useState<CellPos | null>(null)
  const [copied, setCopied] = useState<CellRange | null>(null)
  const [fillPreview, setFillPreview] = useState<CellRange | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const pendingFocus = useRef(false)
  const dragging = useRef(false)
  const fillDrag = useRef<{ source: CellRange; preview: CellRange | null } | null>(null)

  const maxR = Math.max(0, rows - 1)
  const maxC = Math.max(0, cols - 1)
  const clampPos = (p: CellPos): CellPos => ({ r: Math.max(0, Math.min(p.r, maxR)), c: Math.max(0, Math.min(p.c, maxC)) })
  const active = clampPos(activeState)
  const range = anchor ? toRange(clampPos(anchor), active) : { r0: active.r, r1: active.r, c0: active.c, c1: active.c }
  const size = rangeSize(range)
  const multi = size > 1
  const valueAt = getValue ?? getText

  useEffect(() => {
    if (!pendingFocus.current || blocked) return
    pendingFocus.current = false
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${String(active.r)}:${String(active.c)}"]`)?.focus()
  })

  const requestFocus = () => {
    pendingFocus.current = true
  }

  /** Makes `pos` the active cell and collapses the selection to it. */
  const setActive = (pos: CellPos, focus = false) => {
    setAnchor(null)
    setActiveState(pos)
    if (focus) pendingFocus.current = true
  }

  /** Selects from `from` to `to`; `to` becomes the active (focused) cell. */
  const select = (from: CellPos, to: CellPos, focus = true) => {
    setAnchor(clampPos(from))
    setActiveState(clampPos(to))
    if (focus) pendingFocus.current = true
  }

  const move = (r: number, c: number, extend = false) => {
    if (extend) setAnchor(anchor ?? active)
    else setAnchor(null)
    setActiveState(clampPos({ r, c }))
    pendingFocus.current = true
  }

  // ---------- clipboard ----------

  const matrixOf = (target: CellRange, withHeaders: boolean) => {
    const body: string[][] = []
    for (let r = target.r0; r <= target.r1; r++) {
      const line: string[] = []
      if (withHeaders && getRowHeader) line.push(getRowHeader(r))
      for (let c = target.c0; c <= target.c1; c++) line.push(getText(r, c))
      body.push(line)
    }
    if (!withHeaders || !getHeader) return { body, headers: undefined }
    const headers = [...(getRowHeader ? [''] : []), ...Array.from({ length: target.c1 - target.c0 + 1 }, (_, j) => getHeader(target.c0 + j))]
    return { body, headers }
  }

  const putOnClipboard = (data: DataTransfer, withHeaders = false) => {
    const { body, headers } = matrixOf(range, withHeaders)
    data.setData('text/plain', toTsv(headers ? [headers, ...body] : body))
    data.setData('text/html', toHtmlTable(body, headers))
  }

  const onCopy = (event: ClipboardEvent<HTMLElement>) => {
    if (blocked) return
    event.preventDefault()
    putOnClipboard(event.clipboardData)
    setCopied(range)
    setMessage(`Copied ${plural(size)}`)
  }

  const onCut = (event: ClipboardEvent<HTMLElement>) => {
    if (blocked) return
    event.preventDefault()
    putOnClipboard(event.clipboardData)
    if (clear) {
      clear(range)
      setCopied(null)
      setMessage(`Cut ${plural(size)}`)
    } else {
      setCopied(range)
      setMessage(`Copied ${plural(size)}`)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    if (blocked || !write) return
    const text = event.clipboardData.getData('text/plain')
    if (!text) return
    event.preventDefault()
    const matrix = parseTsv(text)
    const result = write(pasteTargets(matrix, range), 'paste')
    const block = pastedRange(matrix, range)
    if (block.r1 > block.r0 || block.c1 > block.c0) select({ r: block.r0, c: block.c0 }, { r: block.r1, c: block.c1 }, false)
    setMessage(result.failed > 0 ? `${plural(result.failed)} could not be pasted` : `Pasted ${plural(result.written)}`)
  }

  /** Ctrl+Shift+C: the selection with column (and row) headers, through the async Clipboard API. */
  const copyWithHeaders = () => {
    const { body, headers } = matrixOf(range, true)
    const text = toTsv(headers ? [headers, ...body] : body)
    const html = toHtmlTable(body, headers)
    if ('clipboard' in navigator && typeof ClipboardItem !== 'undefined') {
      void navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) }),
      ])
    } else if ('clipboard' in navigator) {
      void navigator.clipboard.writeText(text)
    }
    setCopied(range)
    setMessage(`Copied ${plural(size)} with headers`)
  }

  // ---------- fill ----------

  const fill = (source: CellRange, target: CellRange) => {
    if (!write) return
    const targets = fillTargets(source, target, valueAt, getText)
    if (!targets.length) return
    const result = write(targets, 'fill')
    select({ r: target.r0, c: target.c0 }, { r: target.r1, c: target.c1 })
    setMessage(result.failed > 0 ? `${plural(result.failed)} could not be filled` : `Filled ${plural(result.written)}`)
  }

  /** Mouse down on the fill handle (the square at the bottom-right of the selection). */
  const startFill = (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || !write || blocked) return
    event.preventDefault()
    event.stopPropagation()
    fillDrag.current = { source: range, preview: null }
    const finish = () => {
      const drag = fillDrag.current
      fillDrag.current = null
      setFillPreview(null)
      if (drag?.preview) fill(drag.source, drag.preview)
    }
    window.addEventListener('mouseup', finish, { once: true })
  }

  // ---------- mouse ----------

  const onCellMouseDown = (event: MouseEvent<HTMLElement>, r: number, c: number) => {
    if (event.button !== 0) return
    const interactive = (event.target as Element).closest(INTERACTIVE)
    if (interactive && event.currentTarget.contains(interactive)) {
      // Let buttons, links and checkboxes inside the cell work normally.
      setActive({ r, c })
      return
    }
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    if (event.shiftKey) {
      setAnchor(anchor ?? active)
      setActiveState({ r, c })
      return
    }
    setAnchor({ r, c })
    setActiveState({ r, c })
    dragging.current = true
    window.addEventListener(
      'mouseup',
      () => {
        dragging.current = false
      },
      { once: true }
    )
  }

  const onCellMouseEnter = (event: MouseEvent<HTMLElement>, r: number, c: number) => {
    const drag = fillDrag.current
    if (drag) {
      drag.preview = extendFill(drag.source, { r, c })
      setFillPreview(drag.preview)
      return
    }
    if (!dragging.current || (event.buttons & 1) === 0) return
    setActiveState({ r, c })
  }

  /**
   * Spread on each cell: position, selection state, edges for the range border and the copy
   * marker, and the mouse handlers. Pass `editing` for the cell whose editor is open.
   */
  const cellProps = (r: number, c: number, editing = false) => {
    const dash = fillPreview ?? copied
    return {
      'data-cell': `${String(r)}:${String(c)}`,
      'data-active': active.r === r && active.c === c ? true : undefined,
      'data-in-range': multi && inRange(range, r, c) ? true : undefined,
      'aria-selected': multi && inRange(range, r, c) ? true : undefined,
      'data-range-edge': multi ? edgesOf(range, r, c) : undefined,
      'data-dash-edge': edgesOf(dash, r, c),
      'data-dash': dash ? (fillPreview ? 'fill' : 'copy') : undefined,
      onMouseDown: editing
        ? undefined
        : (event: MouseEvent<HTMLElement>) => {
            onCellMouseDown(event, r, c)
          },
      onMouseEnter: (event: MouseEvent<HTMLElement>) => {
        onCellMouseEnter(event, r, c)
      },
    }
  }

  /** True when the fill handle belongs in this cell (bottom-right of the selection). */
  const hasFillHandle = (r: number, c: number) => Boolean(write) && !blocked && !fillPreview && r === range.r1 && c === range.c1

  const rowSelected = (r: number) => r >= range.r0 && r <= range.r1
  const colSelected = (c: number) => c >= range.c0 && c <= range.c1

  // ---------- keyboard ----------

  /** Handles selection, clipboard-adjacent and fill keys. Returns true when it handled the key. */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>): boolean => {
    if (blocked || event.defaultPrevented) return false
    const { key, shiftKey, altKey } = event
    const ctrl = event.ctrlKey || event.metaKey
    const k = key.toLowerCase()
    const handle = (fn: () => void) => {
      event.preventDefault()
      fn()
      return true
    }
    if (altKey) return false
    switch (key) {
      case 'ArrowDown':
        return handle(() => {
          move(ctrl ? maxR : active.r + 1, active.c, shiftKey)
        })
      case 'ArrowUp':
        return handle(() => {
          move(ctrl ? 0 : active.r - 1, active.c, shiftKey)
        })
      case 'ArrowRight':
        return handle(() => {
          move(active.r, ctrl ? maxC : active.c + 1, shiftKey)
        })
      case 'ArrowLeft':
        return handle(() => {
          move(active.r, ctrl ? 0 : active.c - 1, shiftKey)
        })
      case 'Home':
        return handle(() => {
          move(ctrl ? 0 : active.r, 0, shiftKey)
        })
      case 'End':
        return handle(() => {
          move(ctrl ? maxR : active.r, maxC, shiftKey)
        })
      case 'PageDown':
        return handle(() => {
          move(active.r + 10, active.c, shiftKey)
        })
      case 'PageUp':
        return handle(() => {
          move(active.r - 10, active.c, shiftKey)
        })
      case 'Escape':
        if (!copied) return false
        return handle(() => {
          setCopied(null)
          setMessage(null)
        })
      case 'Delete':
      case 'Backspace':
        if (!clear) return false
        return handle(() => {
          clear(range)
          setCopied(null)
        })
      case ' ':
        // Whole row / column; focus goes to its first cell.
        if (shiftKey && !ctrl)
          return handle(() => {
            select({ r: active.r, c: maxC }, { r: active.r, c: 0 })
          })
        if (ctrl && !shiftKey)
          return handle(() => {
            select({ r: maxR, c: active.c }, { r: 0, c: active.c })
          })
        return false
    }
    if (!ctrl) return false
    if (k === 'a' && !shiftKey)
      return handle(() => {
        select({ r: 0, c: 0 }, { r: maxR, c: maxC })
      })
    if (k === 'c' && shiftKey)
      return handle(() => {
        copyWithHeaders()
      })
    if ((k === 'd' || k === 'r') && !shiftKey && write) {
      const plan = fillShortcut(range, k === 'd' ? 'down' : 'right')
      return handle(() => {
        if (plan) fill(plan.source, plan.target)
      })
    }
    return false
  }

  // ---------- summary ----------

  let summary: RangeSummary | null = null
  if (multi && size <= SUMMARY_LIMIT) {
    const values: unknown[] = []
    for (let r = range.r0; r <= range.r1; r++) for (let c = range.c0; c <= range.c1; c++) values.push(valueAt(r, c))
    summary = summarize(values)
  }

  return {
    active,
    range,
    size,
    multi,
    copied,
    fillPreview,
    summary,
    message,
    setMessage,
    setActive,
    select,
    move,
    requestFocus,
    cellProps,
    hasFillHandle,
    startFill,
    rowSelected,
    colSelected,
    onKeyDown,
    onCopy,
    onCut,
    onPaste,
    copyWithHeaders,
  }
}

export type CellRangeState = ReturnType<typeof useCellRange>
