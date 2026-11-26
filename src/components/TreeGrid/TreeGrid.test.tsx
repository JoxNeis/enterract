import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TreeGrid } from './TreeGrid'
import { costColumns, costRows } from './TreeGrid.fixtures'

const cell = (name: string | RegExp) => screen.getByRole('gridcell', { name })

describe('TreeGrid', () => {
  it('renders a treegrid with levels and rolled-up totals', () => {
    render(
      <TreeGrid
        aria-label='Project costs'
        rows={costRows}
        columns={costColumns}
        defaultExpanded={['p', 'p1']}
        className='extra'
      />
    )
    const grid = screen.getByRole('treegrid', { name: 'Project costs' })
    expect(grid.parentElement).toHaveClass('erp-tree-grid', 'extra')
    expect(cell('Cost item: Building').closest('tr')).toHaveAttribute('aria-level', '2')
    expect(cell('Budget: 550,000')).toBeInTheDocument()
    expect(cell('Budget: 1,260,000')).toBeInTheDocument()
  })

  it('expands and collapses with arrows on the first column', async () => {
    render(
      <TreeGrid
        aria-label='Project costs'
        rows={costRows}
        columns={costColumns}
      />
    )
    await userEvent.click(cell('Cost item: New plant Cikarang'))
    await userEvent.keyboard('{ArrowRight}')
    expect(cell('Cost item: Building')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}')
    expect(cell('Cost item: Foundation')).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(cell('Cost item: Building')).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.queryByRole('gridcell', { name: 'Cost item: Foundation' })).toBeNull()
  })

  it('edits a leaf value with Enter and does not edit roll-ups', async () => {
    const onCellChange = vi.fn()
    render(
      <TreeGrid
        aria-label='Project costs'
        rows={costRows}
        columns={costColumns}
        defaultExpanded={['p', 'p1']}
        onCellChange={onCellChange}
      />
    )
    expect(cell('Budget: 550,000')).toHaveAttribute('aria-readonly', 'true')
    await userEvent.click(cell('Budget: 90,000'))
    await userEvent.keyboard('{Enter}')
    const input = screen.getByRole('textbox', { name: 'Budget' })
    await userEvent.clear(input)
    await userEvent.type(input, '95000{Enter}')
    expect(onCellChange).toHaveBeenCalledWith('p13', 'budget', 95000)
  })

  it('loads children lazily', async () => {
    render(
      <TreeGrid
        aria-label='Project costs'
        rows={costRows}
        columns={costColumns}
        defaultExpanded={['p']}
        loadChildren={() => Promise.resolve([{ id: 'x', data: { name: 'Servers', budget: 1, actual: 0 } }])}
      />
    )
    await userEvent.click(cell('Cost item: IT and network'))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(cell('Cost item: Servers')).toBeInTheDocument()
    })
  })

  it('copies a range and pastes a block in one batched change, skipping roll-ups', async () => {
    const onCellsChange = vi.fn()
    render(
      <TreeGrid
        aria-label='Project costs'
        rows={costRows}
        columns={costColumns}
        defaultExpanded={['p', 'p1']}
        onCellsChange={onCellsChange}
      />
    )
    await userEvent.click(cell('Budget: 120,000'))
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowRight}{/Shift}')
    expect(cell('Actual: 352,900')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Sum: 931,300')).toBeInTheDocument()

    const copy = new DataTransfer()
    cell('Actual: 352,900').dispatchEvent(Object.assign(new Event('copy', { bubbles: true, cancelable: true }), { clipboardData: copy }))
    expect(copy.getData('text/plain')).toBe('120000\t118400\n340000\t352900')

    // Paste two rows starting on the Building roll-up row: its cells are skipped, Foundation is written.
    await userEvent.click(cell('Budget: 550,000'))
    const paste = new DataTransfer()
    paste.setData('text/plain', '1\t2\n3\t4')
    cell('Budget: 550,000').dispatchEvent(Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData: paste }))
    expect(onCellsChange).toHaveBeenCalledTimes(1)
    expect(onCellsChange).toHaveBeenCalledWith([
      { rowId: 'p11', field: 'budget', value: 3 },
      { rowId: 'p11', field: 'actual', value: 4 },
    ])
  })
})
