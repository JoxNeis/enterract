import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PivotFieldList } from './PivotFieldList'

const fields = [
  { key: 'region', label: 'Region' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'revenue', label: 'Revenue', numeric: true },
]

describe('PivotFieldList', () => {
  it('adds fields to rows and values', async () => {
    const onChange = vi.fn()
    render(
      <PivotFieldList
        fields={fields}
        onChange={onChange}
        className='extra'
      />
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Add to Rows' }))
    await userEvent.click(screen.getByRole('option', { name: 'Region' }))
    expect(onChange).toHaveBeenLastCalledWith({ rows: ['region'], columns: [], values: [] })
    await userEvent.click(screen.getByRole('combobox', { name: 'Add to Values' }))
    await userEvent.click(screen.getByRole('option', { name: 'Revenue' }))
    expect(onChange).toHaveBeenLastCalledWith({ rows: ['region'], columns: [], values: [{ field: 'revenue', aggregate: 'sum' }] })
  })

  it('reorders and removes', async () => {
    const onChange = vi.fn()
    render(
      <PivotFieldList
        fields={fields}
        defaultValue={{ rows: ['region', 'quarter'], columns: [], values: [] }}
        onChange={onChange}
      />
    )
    const rows = screen.getByRole('region', { name: 'Rows' })
    await userEvent.click(within(rows).getByRole('button', { name: 'Move Quarter up in Rows' }))
    expect(onChange).toHaveBeenLastCalledWith({ rows: ['quarter', 'region'], columns: [], values: [] })
    await userEvent.click(within(rows).getByRole('button', { name: 'Remove Region from Rows' }))
    expect(onChange).toHaveBeenLastCalledWith({ rows: ['quarter'], columns: [], values: [] })
  })
})
