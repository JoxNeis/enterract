import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MenuButton } from './MenuButton'

const items = [
  { key: 'pdf', label: 'Export PDF' },
  { key: 'xlsx', label: 'Export Excel' },
  { key: 'locked', label: 'Archive', disabled: true },
  { key: 'delete', label: 'Delete', danger: true, separatorBefore: true },
]

describe('MenuButton', () => {
  it('opens with ArrowDown, moves and selects with Enter', async () => {
    const onSelect = vi.fn()
    render(
      <MenuButton
        items={items}
        onSelect={onSelect}
        className='extra'
      >
        Export
      </MenuButton>
    )

    const button = screen.getByRole('button', { name: 'Export' })
    expect(button).toHaveClass('erp-menu-button', 'extra')
    button.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Export PDF' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('delete')
    expect(button).toHaveFocus()
  })

  it('closes with Escape and returns focus', async () => {
    render(<MenuButton items={items}>Export</MenuButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus()
  })

  it('does not select disabled items', async () => {
    const onSelect = vi.fn()
    render(
      <MenuButton
        items={items}
        onSelect={onSelect}
      >
        Export
      </MenuButton>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
