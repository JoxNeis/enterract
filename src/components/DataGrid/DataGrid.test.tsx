import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { parseBoolean, parseTsv, toTsv } from './clipboard'
import { DataGrid, type DataGridProps } from './DataGrid'
import { lineColumns, lineRows, newLine, newLineMeta, type Line, type LineMeta } from './DataGrid.fixtures'
import { acceptChanges, deleteRows, getChanges, rejectChanges, updateCell } from './gridRows'
import type { GridRow } from './types'
import { useGridRows } from './useGridRows'

function Harness(props: Partial<DataGridProps<Line, LineMeta>> & { onChanges?: (json: string) => void }) {
  const { onChanges, ...rest } = props
  const grid = useGridRows(lineRows)
  return (
    <>
      <DataGrid<Line, LineMeta>
        aria-label='Order lines'
        columns={lineColumns}
        newRow={newLine}
        newRowMeta={newLineMeta}
        {...rest}
        rows={grid.rows}
        onRowsChange={(rows) => {
          grid.setRows(rows)
          onChanges?.(JSON.stringify(getChanges(rows)))
        }}
      />
      <button onClick={() => { grid.acceptChanges() }}>Accept</button>
      <output data-testid='dirty'>{grid.isDirty ? 'dirty' : 'clean'}</output>
      <pre data-testid='changes'>{JSON.stringify(grid.getChanges())}</pre>
    </>
  )
}

const cell = (name: RegExp) => screen.getByRole('gridcell', { name })
const changes = () => JSON.parse(screen.getByTestId('changes').textContent) as ReturnType<typeof getChanges<Line, LineMeta>>

function paste(target: HTMLElement, text: string) {
  const data = new DataTransfer()
  data.setData('text/plain', text)
  target.dispatchEvent(Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData: data }))
}

describe('row model', () => {
  const [row] = lineRows
  if (!row) throw new Error('fixture missing')

  it('tracks changes by value', () => {
    const edited = updateCell(row, 'qty', 5)
    expect(edited.status).toBe('modified')
    expect(edited.changedFields).toEqual(['qty'])
    expect(updateCell(edited, 'qty', 100).status).toBe('unchanged')
  })

  it('deletes, accepts and rejects', () => {
    const added: GridRow<Line, LineMeta> = { id: 'new-x', data: newLine(), meta: newLineMeta(), status: 'added' }
    const rows = deleteRows([row, added], [row.id, added.id])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('deleted')
    expect(getChanges(rows).deleted[0]?.meta.lineId).toBe(101)
    expect(acceptChanges(rows)).toHaveLength(0)
    expect(rejectChanges(rows)[0]?.status).toBe('unchanged')
  })
})

describe('clipboard helpers', () => {
  it('round-trips Excel quoting', () => {
    const matrix = [['a\tb', 'say "hi"'], ['line1\nline2', '']]
    expect(parseTsv(toTsv(matrix))).toEqual(matrix)
    expect(parseTsv('1\t2\r\n3\t4\r\n')).toEqual([['1', '2'], ['3', '4']])
  })

  it('parses booleans', () => {
    expect(parseBoolean('TRUE')).toEqual({ ok: true, value: true })
    expect(parseBoolean('x')).toEqual({ ok: true, value: true })
    expect(parseBoolean('nope').ok).toBe(false)
  })
})

describe('DataGrid', () => {
  it('renders a grid with headers, cells and className', () => {
    render(<Harness className='extra' />)

    const grid = screen.getByRole('grid', { name: 'Order lines' })
    expect(grid.closest('.erp-data-grid')).toHaveClass('extra')
    expect(within(grid).getAllByRole('columnheader').map((h) => h.textContent)).toContain('Qty*')
    expect(cell(/^qty, row 1\b/i)).toHaveTextContent('100.00')
  })

  it('edits a cell by typing, Enter commits and tracks the change', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^qty, row 1\b/i))
    await userEvent.keyboard('5{Enter}')
    expect(cell(/^qty, row 1\b/i)).toHaveTextContent('5.00')
    expect(cell(/^qty, row 1\b/i)).toHaveAttribute('data-changed', 'true')
    expect(screen.getByTestId('dirty')).toHaveTextContent('dirty')
    const { modified } = changes()
    expect(modified[0]?.changedFields).toEqual(['qty'])
    expect(modified[0]?.meta).toEqual({ lineId: 101, version: 3, posted: false })
    expect(cell(/^qty, row 2\b/i)).toHaveFocus()
  })

  it('editing back to the original makes the row unchanged', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^qty, row 1\b/i))
    await userEvent.keyboard('5{Enter}')
    await userEvent.click(cell(/^qty, row 1\b/i))
    await userEvent.keyboard('{F2}{Control>}a{/Control}100{Enter}')
    expect(screen.getByTestId('dirty')).toHaveTextContent('clean')
  })

  it('Escape cancels an edit', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^note, row 1\b/i))
    await userEvent.keyboard('Hello{Escape}')
    expect(screen.getByTestId('dirty')).toHaveTextContent('clean')
    expect(cell(/^note, row 1\b/i)).toHaveFocus()
  })

  it('moves with arrows and Tab commits and moves right', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^note, row 1\b/i))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(cell(/^note, row 3\b/i)).toHaveFocus()
    await userEvent.click(cell(/^qty, row 2\b/i))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{Tab}')
    expect(cell(/^uom, row 2\b/i)).toHaveFocus()
  })

  it('Space toggles a checkbox cell without edit mode', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^taxable, row 1\b/i))
    await userEvent.keyboard(' ')
    expect(cell(/^taxable, row 1\b/i)).toHaveAccessibleName(/: No$/)
    expect(changes().modified[0]?.changedFields).toEqual(['taxable'])
  })

  it('locks posted rows through meta', async () => {
    render(<Harness />)

    const locked = cell(/^qty, row 3\b/i)
    expect(locked).toHaveAttribute('aria-readonly', 'true')
    await userEvent.click(locked)
    await userEvent.keyboard('9{Enter}')
    expect(screen.getByTestId('dirty')).toHaveTextContent('clean')
  })

  it('shows validation errors on cells', () => {
    render(<Harness />)

    const invalid = cell(/^qty, row 4\b/i)
    expect(invalid).toHaveAttribute('aria-invalid', 'true')
    expect(invalid).toHaveAccessibleName(/error: Required/)
  })

  it('adds and deletes rows with change tracking', async () => {
    render(
      <Harness
        allowAdd
        allowDelete
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add row' }))
    expect(changes().added).toHaveLength(1)
    await userEvent.click(cell(/^note, row 1\b/i))
    await userEvent.click(screen.getByRole('button', { name: 'Delete row' }))
    expect(changes().deleted[0]?.meta.lineId).toBe(101)
    expect(screen.queryByRole('gridcell', { name: /^item, row 5\b.*Work gloves/i })).not.toBeNull()
  })

  it('pastes TSV, skips bad cells and reports them as one undo step', async () => {
    const onCellError = vi.fn()
    render(
      <Harness
        allowAddOnPaste
        onCellError={onCellError}
      />
    )

    const target = cell(/^qty, row 4\b/i)
    await userEvent.click(target)
    paste(target, '5\tBOX\tFALSE\nabc\tPCS\tTRUE\n7\tKG\tx')
    expect(await screen.findByText('1 cell could not be pasted')).toBeInTheDocument()
    expect(onCellError).toHaveBeenCalledWith('105', 'qty', expect.stringContaining('abc'))
    expect(cell(/^qty, row 4\b/i)).toHaveTextContent('5.00')
    expect(cell(/^uom, row 5\b/i)).toHaveTextContent('Pieces')
    expect(changes().added).toHaveLength(1)

    await userEvent.click(cell(/^note, row 1\b/i))
    await userEvent.keyboard('{Control>}z{/Control}')
    expect(screen.getByTestId('dirty')).toHaveTextContent('clean')
  })

  it('parses pasted numbers by locale', async () => {
    render(<Harness locale='de-DE' />)

    const target = cell(/^qty, row 1\b/i)
    await userEvent.click(target)
    paste(target, '1.234,50')
    await waitFor(() => {
      expect(cell(/^qty, row 1\b/i)).toHaveTextContent('1.234,50')
    })
  })

  it('copies the selection as TSV and HTML', async () => {
    render(<Harness />)

    await userEvent.click(cell(/^qty, row 1\b/i))
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowDown}{/Shift}')
    const data = new DataTransfer()
    const event = Object.assign(new Event('copy', { bubbles: true, cancelable: true }), { clipboardData: data })
    cell(/^taxable, row 2\b/i).dispatchEvent(event)
    expect(data.getData('text/plain')).toBe('100\tPieces\tTRUE\n100\tPieces\tTRUE')
    expect(data.getData('text/html')).toContain('<td>Pieces</td>')
  })

  it('does not edit when the grid is read-only', async () => {
    render(<Harness editable={false} />)

    await userEvent.click(cell(/^note, row 1\b/i))
    await userEvent.keyboard('abc{Enter}')
    expect(screen.getByTestId('dirty')).toHaveTextContent('clean')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-readonly', 'true')
  })

  it('sorts by header click', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: /^qty/i }))
    expect(screen.getByRole('columnheader', { name: /qty/i })).toHaveAttribute('aria-sort', 'ascending')
    expect(cell(/^qty, row 1\b/i)).toHaveTextContent('4.00')
  })

  it('selects all rows with the bulk checkbox', async () => {
    const onSelectionChange = vi.fn()
    render(
      <Harness
        selectionMode='multiple'
        onSelectionChange={onSelectionChange}
      />
    )

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['101', '102', '103', '104', '105'])
  })

  it('shows an empty state and totals', () => {
    render(
      <DataGrid<Line, LineMeta>
        rows={[]}
        columns={lineColumns}
        emptyText='No lines yet'
      />
    )
    expect(screen.getByText('No lines yet')).toBeInTheDocument()
  })

  describe('Excel-style selection', () => {
    const qty = (row: number) => cell(new RegExp(`^qty, row ${String(row)}\\b`, 'i'))
    const note = (row: number) => cell(new RegExp(`^note, row ${String(row)}\\b`, 'i'))

    it('selects a range by dragging and shows Average, Count and Sum', () => {
      render(<Harness />)
      fireEvent.mouseDown(qty(1), { button: 0 })
      fireEvent.mouseEnter(qty(3), { buttons: 1 })
      fireEvent.mouseUp(window)
      for (const row of [1, 2, 3]) expect(qty(row)).toHaveAttribute('aria-selected', 'true')
      expect(qty(1)).toHaveAttribute('data-range-edge', 't r l')
      expect(qty(3)).toHaveAttribute('data-range-edge', 'r b l')
      expect(screen.getByText('Count: 3')).toBeInTheDocument()
      expect(screen.getByText('Sum: 212.5')).toBeInTheDocument()
      expect(screen.getByText('Average: 70.8333')).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /Qty/ })).toHaveAttribute('data-range-col', 'true')
      // Moving without the button held does not extend the selection.
      fireEvent.mouseEnter(qty(4), { buttons: 0 })
      expect(qty(4)).not.toHaveAttribute('aria-selected')
    })

    it('extends with Shift+click, selects a row with Shift+Space and a column with Ctrl+Space', async () => {
      render(<Harness />)
      await userEvent.click(qty(2))
      fireEvent.mouseDown(note(3), { button: 0, shiftKey: true })
      expect(qty(3)).toHaveAttribute('aria-selected', 'true')
      await userEvent.click(qty(2))
      await userEvent.keyboard('{Shift>} {/Shift}')
      const row = qty(2).closest('tr')
      if (!row) throw new Error('row missing')
      for (const td of within(row).getAllByRole('gridcell').filter((c) => c.hasAttribute('data-cell')))
        expect(td).toHaveAttribute('aria-selected', 'true')
      await userEvent.click(qty(2))
      await userEvent.keyboard('{Control>} {/Control}')
      expect(qty(1)).toHaveAttribute('aria-selected', 'true')
      expect(qty(5)).toHaveAttribute('aria-selected', 'true')
      expect(note(2)).not.toHaveAttribute('aria-selected')
    })

    it('marks the copied range until Escape, and cut clears the cells', async () => {
      render(<Harness />)
      await userEvent.click(note(3))
      const copy = new DataTransfer()
      note(3).dispatchEvent(Object.assign(new Event('copy', { bubbles: true, cancelable: true }), { clipboardData: copy }))
      await waitFor(() => {
        expect(note(3)).toHaveAttribute('data-dash', 'copy')
      })
      expect(note(3)).toHaveAttribute('data-dash-edge', 't r b l')
      await userEvent.keyboard('{Escape}')
      expect(note(3)).not.toHaveAttribute('data-dash')

      const cut = new DataTransfer()
      note(3).dispatchEvent(Object.assign(new Event('cut', { bubbles: true, cancelable: true }), { clipboardData: cut }))
      expect(cut.getData('text/plain')).toBe('Cut to 2.5 m')
      expect(await screen.findByText('Cut 1 cell')).toBeInTheDocument()
      expect(note(3)).toHaveTextContent('')
      expect(changes().modified).toHaveLength(1)
    })

    it('fills down with Ctrl+D as one undo step', async () => {
      render(<Harness />)
      await userEvent.click(note(3))
      await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}')
      expect(note(4)).toHaveTextContent('Cut to 2.5 m')
      expect(note(5)).toHaveTextContent('Cut to 2.5 m')
      expect(await screen.findByText('Filled 2 cells')).toBeInTheDocument()
      await userEvent.keyboard('{Control>}z{/Control}')
      expect(note(4)).toHaveTextContent('Qty missing')
      expect(note(5)).toHaveTextContent('')
    })

    it('continues a number series with the fill handle', async () => {
      render(<Harness />)
      await userEvent.click(qty(4))
      await userEvent.keyboard('7{Enter}')
      // 12.5 then 7 → the next value is 1.5
      await userEvent.click(qty(3))
      await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
      const handle = document.querySelector<HTMLElement>('.erp-fill-handle')
      if (!handle) throw new Error('fill handle missing')
      fireEvent.mouseDown(handle, { button: 0 })
      fireEvent.mouseEnter(qty(5), { buttons: 1 })
      expect(qty(5)).toHaveAttribute('data-dash', 'fill')
      fireEvent.mouseUp(window)
      await waitFor(() => {
        expect(qty(5)).toHaveTextContent('1.50')
      })
    })

    it('tiles a pasted block over a larger selection', async () => {
      render(<Harness />)
      await userEvent.click(qty(1))
      await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{ArrowDown}{/Shift}')
      paste(qty(4), '7\n8')
      await waitFor(() => {
        expect(qty(4)).toHaveTextContent('8.00')
      })
      // Row 3 is a posted line: its locked Qty is skipped.
      expect([1, 2, 3, 4].map((r) => qty(r).textContent)).toEqual(['7.00', '8.00', '12.50', '8.00'])
    })
  })
})
