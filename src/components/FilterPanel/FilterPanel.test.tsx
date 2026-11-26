import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterPanel, type FilterDefinition } from './FilterPanel'
import { isFilterActive } from './filterValues'

const filters: FilterDefinition[] = [
  { id: 'search', label: 'Customer name', type: 'text' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { key: 'open', label: 'Open' },
      { key: 'posted', label: 'Posted' },
    ],
  },
  { id: 'overdue', label: 'Overdue only', type: 'checkbox' },
  { id: 'amount', label: 'Amount', type: 'number-range' },
]

describe('isFilterActive', () => {
  it('ignores empty values', () => {
    expect(isFilterActive(null)).toBe(false)
    expect(isFilterActive([])).toBe(false)
    expect(isFilterActive({ from: null, to: null })).toBe(false)
    expect(isFilterActive({ from: 1, to: null })).toBe(true)
    expect(isFilterActive('x')).toBe(true)
  })
})

describe('FilterPanel', () => {
  it('applies on submit and counts active filters', async () => {
    const onApply = vi.fn()
    render(
      <FilterPanel
        filters={filters}
        onApply={onApply}
        className='extra'
      />
    )

    const form = screen.getByRole('search', { name: 'Filters' })
    expect(form).toHaveClass('erp-filter-panel', 'extra')
    await userEvent.type(screen.getByRole('textbox', { name: 'Customer name' }), 'acme{Enter}')
    expect(onApply).toHaveBeenLastCalledWith({ search: 'acme' })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Overdue only' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenLastCalledWith({ search: 'acme', overdue: true })
    expect(screen.getByLabelText('2 active')).toBeInTheDocument()
  })

  it('resets', async () => {
    const onReset = vi.fn()
    render(
      <FilterPanel
        filters={filters}
        defaultValue={{ search: 'acme' }}
        onReset={onReset}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Customer name' })).toHaveValue('')
  })

  it('applies live and collapses', async () => {
    const onApply = vi.fn()
    render(
      <FilterPanel
        filters={filters}
        applyMode='live'
        collapsible
        onApply={onApply}
      />
    )
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Overdue only' }))
    expect(onApply).toHaveBeenCalledWith({ overdue: true })
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})
