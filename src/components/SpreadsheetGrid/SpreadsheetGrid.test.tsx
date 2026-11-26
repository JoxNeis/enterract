import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { columnName, evaluateSheet, parseAddress, shiftFormula } from './formula'
import { SpreadsheetGrid } from './SpreadsheetGrid'

describe('formula engine', () => {
  it('shifts relative references and keeps $ references', () => {
    expect(shiftFormula('=A1*2+SUM(B1:B3)', 1, 0)).toBe('=A2*2+SUM(B2:B4)')
    expect(shiftFormula('=$A$1+A$1+$A1', 2, 1)).toBe('=$A$1+B$1+$A3')
    expect(shiftFormula('=A1', -1, 0)).toBe('=#REF!')
    expect(shiftFormula('42', 3, 3)).toBe('42')
    expect(evaluateSheet({ A1: '4', B1: '=$A$1*2', B2: '=#REF!+1' })).toMatchObject({ B1: 8, B2: '#REF!' })
  })

  it('addresses columns', () => {
    expect(columnName(0)).toBe('A')
    expect(columnName(27)).toBe('AB')
    expect(parseAddress('AB12')).toEqual({ col: 27, row: 11 })
  })

  it('evaluates references, ranges and functions', () => {
    const v = evaluateSheet({ A1: '10', A2: '20', A3: '=SUM(A1:A2)*1.5', B1: '=AVERAGE(A1:A2)', B2: '=ROUND(10/3, 2)', B3: '=MAX(A1, A2, 5) - MIN(A1:A2)' })
    expect(v.A3).toBe(45)
    expect(v.B1).toBe(15)
    expect(v.B2).toBe(3.33)
    expect(v.B3).toBe(10)
  })

  it('reports errors', () => {
    const v = evaluateSheet({ A1: '=A2', A2: '=A1', B1: '=1/0', B2: 'text', B3: '=B2+1', C1: '=FOO(1)', C2: '=(1+' })
    expect(v.A1).toBe('#CYCLE!')
    expect(v.B1).toBe('#DIV/0!')
    expect(v.B3).toBe('#VALUE!')
    expect(v.C1).toBe('#NAME?')
    expect(v.C2).toBe('#ERROR!')
  })
})

describe('SpreadsheetGrid', () => {
  it('edits cells and recomputes formulas', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Budget'
        rows={5}
        columns={3}
        defaultValue={{ A1: '10', A2: '=A1*2' }}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('grid', { name: 'Budget' }).closest('.erp-spreadsheet')).toHaveClass('extra')
    expect(screen.getByRole('gridcell', { name: 'A2: 20, formula =A1*2' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('gridcell', { name: 'A1: 10' }))
    await userEvent.keyboard('7{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ A1: '7', A2: '=A1*2' })
    expect(screen.getByRole('gridcell', { name: 'A2: 14, formula =A1*2' })).toHaveFocus()
  })

  it('shows the formula in the formula bar and edits there', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Sheet'
        rows={3}
        columns={3}
        defaultValue={{ B2: '=1+1' }}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('gridcell', { name: /^B2/ }))
    expect(screen.getByRole('textbox', { name: 'Contents of B2' })).toHaveValue('=1+1')
    const bar = screen.getByRole('textbox', { name: 'Contents of B2' })
    await userEvent.clear(bar)
    await userEvent.type(bar, '=5*5{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ B2: '=5*5' })
  })

  it('pastes TSV and clears with Delete', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Sheet'
        rows={3}
        columns={3}
        onChange={onChange}
      />
    )
    const a1 = screen.getByRole('gridcell', { name: 'A1' })
    await userEvent.click(a1)
    const data = new DataTransfer()
    data.setData('text/plain', '1\t2\n3\t=A1+B2')
    a1.dispatchEvent(Object.assign(new Event('paste', { bubbles: true, cancelable: true }), { clipboardData: data }))
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ A1: '1', B1: '2', A2: '3', B2: '=A1+B2' })
    })
    // Like Excel, the pasted block is selected afterwards.
    expect(screen.getByRole('gridcell', { name: /^B2/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('gridcell', { name: /^A1/ }))
    await userEvent.keyboard('{Delete}')
    expect(onChange).toHaveBeenLastCalledWith({ B1: '2', A2: '3', B2: '=A1+B2' })
  })

  it('does not edit when read-only', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Sheet'
        rows={2}
        columns={2}
        readOnly
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('gridcell', { name: 'A1' }))
    await userEvent.keyboard('5{Delete}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('fills formulas down with the fill handle, shifting references', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Sheet'
        rows={4}
        columns={3}
        defaultValue={{ A1: '1', A2: '2', A3: '3', B1: '=A1*$C$1', C1: '10' }}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('gridcell', { name: /^B1/ }))
    const handle = document.querySelector<HTMLElement>('.erp-fill-handle')
    if (!handle) throw new Error('fill handle missing')
    fireEvent.mouseDown(handle, { button: 0 })
    fireEvent.mouseEnter(screen.getByRole('gridcell', { name: /^B3/ }), { buttons: 1 })
    fireEvent.mouseUp(window)
    expect(onChange).toHaveBeenLastCalledWith({ A1: '1', A2: '2', A3: '3', B1: '=A1*$C$1', B2: '=A2*$C$1', B3: '=A3*$C$1', C1: '10' })
    expect(screen.getByRole('gridcell', { name: /^B3: 30/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Sum: 60')).toBeInTheDocument()
  })

  it('cuts a range to the clipboard and clears it', async () => {
    const onChange = vi.fn()
    render(
      <SpreadsheetGrid
        aria-label='Sheet'
        rows={3}
        columns={3}
        defaultValue={{ A1: '1', B1: '2' }}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('gridcell', { name: /^A1/ }))
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(screen.getByLabelText('Active cell')).toHaveTextContent('A1:B1')
    const data = new DataTransfer()
    screen
      .getByRole('gridcell', { name: /^B1/ })
      .dispatchEvent(Object.assign(new Event('cut', { bubbles: true, cancelable: true }), { clipboardData: data }))
    expect(data.getData('text/plain')).toBe('1\t2')
    expect(onChange).toHaveBeenLastCalledWith({})
  })
})
