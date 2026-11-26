import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DualListSelector } from './DualListSelector'

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'credit', label: 'Credit limit' },
]

describe('DualListSelector', () => {
  it('moves items between the lists with buttons and Enter', async () => {
    const onChange = vi.fn()
    render(
      <DualListSelector
        label='Report columns'
        options={columns}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Report columns' })).toBeInTheDocument()
    const available = screen.getByRole('listbox', { name: /available/i })
    await userEvent.click(within(available).getByRole('option', { name: 'Name' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onChange).toHaveBeenLastCalledWith(['name'])
    available.focus()
    await userEvent.keyboard('{Enter}')
    // The active row stays at the same position: City moved up into it.
    expect(onChange).toHaveBeenLastCalledWith(['name', 'city'])
    await userEvent.click(screen.getByRole('button', { name: 'Remove all' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('orders the selected list', async () => {
    const onChange = vi.fn()
    render(
      <DualListSelector
        label='Columns'
        options={columns}
        defaultValue={['code', 'name']}
        orderable
        onChange={onChange}
      />
    )
    const selected = screen.getByRole('listbox', { name: /^selected/i })
    await userEvent.click(within(selected).getByRole('option', { name: 'Name' }))
    await userEvent.click(screen.getByRole('button', { name: 'Move up' }))
    expect(onChange).toHaveBeenLastCalledWith(['name', 'code'])
  })

  it('filters and is read-only', async () => {
    render(
      <DualListSelector
        label='Columns'
        options={columns}
        readOnly
      />
    )
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'cr')
    expect(within(screen.getByRole('listbox', { name: /available/i })).getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Add all' })).toBeDisabled()
  })
})
