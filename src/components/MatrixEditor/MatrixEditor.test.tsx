import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MatrixEditor } from './MatrixEditor'

const sizes = [
  { key: 'S', label: 'Small' },
  { key: 'M', label: 'Medium' },
]
const colors = [
  { key: 'red', label: 'Red' },
  { key: 'blue', label: 'Blue' },
]

const cell = (name: RegExp | string) => screen.getByRole('gridcell', { name: typeof name === 'string' ? new RegExp(`^${name}:`) : name })

function clipboard(target: HTMLElement, type: 'copy' | 'cut' | 'paste', text = '') {
  const data = new DataTransfer()
  if (text) data.setData('text/plain', text)
  target.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { clipboardData: data }))
  return data
}

describe('MatrixEditor', () => {
  it('edits a cell by typing and updates the totals', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={sizes}
        columns={colors}
        defaultValue={{ S: { red: 5 } }}
        onChange={onChange}
        className='extra'
      />
    )
    const grid = screen.getByRole('grid', { name: 'Quantities' })
    expect(grid.closest('.erp-matrix-editor')).toHaveClass('extra')
    await user.click(cell('Medium, Blue'))
    await user.keyboard('7{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ S: { red: 5 }, M: { blue: 7 } })
    expect(cell('Grand total')).toHaveTextContent('12')
    expect(cell('Total, Blue')).toHaveTextContent('7')
  })

  it('moves with arrow keys and keeps the editor open for invalid amounts', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={sizes}
        columns={colors}
        onChange={onChange}
      />
    )
    await user.click(cell('Small, Red'))
    await user.keyboard('{ArrowDown}')
    expect(cell('Medium, Red')).toHaveFocus()
    await user.keyboard('1.5')
    const input = screen.getByRole('textbox', { name: 'Medium, Red' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await user.keyboard('{Enter}')
    expect(input).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('pastes a block from Excel and selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={sizes}
        columns={colors}
        onChange={onChange}
      />
    )
    await user.click(cell('Small, Red'))
    clipboard(cell('Small, Red'), 'paste', '1\t2\n3\t4')
    expect(onChange).toHaveBeenLastCalledWith({ S: { red: 1, blue: 2 }, M: { red: 3, blue: 4 } })
    await waitFor(() => {
      expect(cell('Medium, Blue')).toHaveAttribute('aria-selected', 'true')
    })
    expect(await screen.findByText('Pasted 4 cells')).toBeInTheDocument()
  })

  it('selects by dragging, copies TSV with totals, shows the summary and clears with Delete', async () => {
    const onChange = vi.fn()
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={sizes}
        columns={colors}
        defaultValue={{ S: { red: 1, blue: 2 }, M: { red: 3, blue: 4 } }}
        onChange={onChange}
      />
    )
    fireEvent.mouseDown(cell('Small, Red'), { button: 0 })
    fireEvent.mouseEnter(cell('Medium, Blue'), { buttons: 1 })
    fireEvent.mouseUp(window)
    expect(cell('Small, Red')).toHaveAttribute('aria-selected', 'true')
    expect(cell('Medium, Blue')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Sum: 10')).toBeInTheDocument()
    expect(screen.getByText('Average: 2.5')).toBeInTheDocument()

    const data = clipboard(cell('Medium, Blue'), 'copy')
    expect(data.getData('text/plain')).toBe('1\t2\n3\t4')
    await waitFor(() => {
      expect(cell('Small, Red')).toHaveAttribute('data-dash-edge', 't l')
    })

    fireEvent.keyDown(cell('Medium, Blue'), { key: 'Delete' })
    expect(onChange).toHaveBeenLastCalledWith({ S: { red: null, blue: null }, M: { red: null, blue: null } })
  })

  it('fills down with Ctrl+D and continues a series with the fill handle', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const rows = [...sizes, { key: 'L', label: 'Large' }, { key: 'XL', label: 'X-Large' }]
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={rows}
        columns={colors}
        defaultValue={{ S: { red: 10, blue: 5 }, M: { red: 20 } }}
        onChange={onChange}
      />
    )
    // Ctrl+D copies the first row of the selection down.
    await user.click(cell('Small, Blue'))
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}')
    expect(onChange).toHaveBeenLastCalledWith({ S: { red: 10, blue: 5 }, M: { red: 20, blue: 5 }, L: { blue: 5 } })

    // 10, 20 dragged down continues as 30, 40.
    await user.click(cell('Small, Red'))
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    const handle = document.querySelector<HTMLElement>('.erp-fill-handle')
    expect(handle).not.toBeNull()
    if (!handle) return
    fireEvent.mouseDown(handle, { button: 0 })
    fireEvent.mouseEnter(cell('X-Large, Red'), { buttons: 1 })
    expect(cell('X-Large, Red')).toHaveAttribute('data-dash', 'fill')
    fireEvent.mouseUp(window)
    expect(onChange).toHaveBeenLastCalledWith({
      S: { red: 10, blue: 5 },
      M: { red: 20, blue: 5 },
      L: { red: 30, blue: 5 },
      XL: { red: 40 },
    })
  })

  it('copies but does not change anything when read-only', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MatrixEditor
        aria-label='Quantities'
        rows={sizes}
        columns={colors}
        defaultValue={{ S: { red: 1 } }}
        onChange={onChange}
        readOnly
      />
    )
    await user.click(cell('Small, Red'))
    await user.keyboard('5{Enter}{Delete}')
    clipboard(cell('Small, Red'), 'paste', '9')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(document.querySelector('.erp-fill-handle')).toBeNull()
    expect(clipboard(cell('Small, Red'), 'copy').getData('text/plain')).toBe('1')
  })
})
