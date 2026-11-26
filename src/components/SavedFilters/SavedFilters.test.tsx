import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SavedFilters, type SavedView } from './SavedFilters'

const views: SavedView<{ status: string }>[] = [
  { id: 'v1', name: 'All orders', filters: { status: '' }, isDefault: true, shared: true },
  { id: 'v2', name: 'My open orders', filters: { status: 'open' }, favorite: true },
  { id: 'v3', name: 'Overdue', filters: { status: 'overdue' } },
]

describe('SavedFilters', () => {
  it('lists favorites first and selects a view', async () => {
    const onSelect = vi.fn()
    render(
      <SavedFilters
        views={views}
        activeId='v1'
        onSelect={onSelect}
        className='extra'
      />
    )
    const trigger = screen.getByRole('button', { name: /all orders/i })
    expect(trigger.parentElement).toHaveClass('erp-saved-filters', 'extra')
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Saved views' })
    const names = within(dialog).getAllByRole('listitem').map((li) => li.textContent)
    expect(names[0]).toContain('My open orders')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Overdue' }))
    expect(onSelect).toHaveBeenCalledWith(views[2])
  })

  it('favorites, deletes (not shared) and shows modified state', async () => {
    const onToggleFavorite = vi.fn()
    const onDelete = vi.fn()
    const onUpdate = vi.fn()
    render(
      <SavedFilters
        views={views}
        activeId='v2'
        modified
        onSelect={vi.fn()}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    )
    expect(screen.getByRole('button', { name: /my open orders\s*\(modified\)/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Update view' }))
    expect(onUpdate).toHaveBeenCalledWith('v2')
    await userEvent.click(screen.getByRole('button', { name: /my open orders/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Add Overdue to favorites' }))
    expect(onToggleFavorite).toHaveBeenCalledWith('v3')
    expect(screen.queryByRole('button', { name: 'Delete All orders' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Delete Overdue' }))
    expect(onDelete).toHaveBeenCalledWith('v3')
  })

  it('saves the current view with a unique name', async () => {
    const onSave = vi.fn()
    render(
      <SavedFilters
        views={views}
        activeId={null}
        onSelect={vi.fn()}
        onSave={onSave}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /unsaved view/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Save current view…' }))
    const dialog = screen.getByRole('dialog', { name: 'Save view' })
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'overdue{Enter}')
    expect(within(dialog).getByText('A view with this name already exists')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), ' > 30 days')
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Open this view by default' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ name: 'overdue > 30 days', isDefault: true })
  })
})
