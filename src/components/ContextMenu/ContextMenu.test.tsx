import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu } from './ContextMenu'

const items = [
  { key: 'open', label: 'Open' },
  { key: 'copy', label: 'Duplicate' },
  { key: 'delete', label: 'Delete', danger: true, separatorBefore: true },
]

describe('ContextMenu', () => {
  it('opens on right-click and selects', async () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu
        items={items}
        onSelect={onSelect}
      >
        <div>Row SO-1</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Row SO-1'), { clientX: 20, clientY: 30 })
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('copy', screen.getByText('Row SO-1'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens with Shift+F10 and closes with Escape returning focus', async () => {
    render(
      <ContextMenu items={items}>
        <button>Row</button>
      </ContextMenu>
    )
    screen.getByRole('button', { name: 'Row' }).focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Row' })).toHaveFocus()
  })

  it('does nothing when disabled', () => {
    render(
      <ContextMenu
        items={items}
        disabled
      >
        <div>Row</div>
      </ContextMenu>
    )
    fireEvent.contextMenu(screen.getByText('Row'))
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
