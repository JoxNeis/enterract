import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterBuilder } from './FilterBuilder'
import { orderFields, orders, sampleFilter } from './FilterBuilder.fixtures'
import { evaluateFilter, filterToText, type FilterGroup } from './filterModel'
import { must } from '../../test/must'

describe('filter model', () => {
  it('evaluates nested AND/OR groups', () => {
    expect(orders.filter((o) => evaluateFilter(sampleFilter, o)).map((o) => o.id)).toEqual([1, 2])
  })

  it('summarizes as text', () => {
    expect(filterToText(sampleFilter, orderFields)).toBe('Status is Open AND (Amount > 1000 OR Customer contains "acme")')
  })

  it('handles between, in and empty checks', () => {
    const g: FilterGroup = {
      kind: 'group',
      id: 'r',
      combinator: 'and',
      rules: [
        { kind: 'condition', id: 'a', field: 'orderDate', operator: 'between', value: ['2026-03-04', '2026-03-10'] },
        { kind: 'condition', id: 'b', field: 'status', operator: 'in', value: ['open'] },
        { kind: 'condition', id: 'c', field: 'customer', operator: 'isNotEmpty', value: null },
      ],
    }
    expect(orders.filter((o) => evaluateFilter(g, o)).map((o) => o.id)).toEqual([2, 3])
  })
})

describe('FilterBuilder', () => {
  it('renders conditions and switches AND/OR', async () => {
    const onChange = vi.fn()
    render(
      <FilterBuilder
        fields={orderFields}
        defaultValue={sampleFilter}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByText(/Status is Open AND/)).toBeInTheDocument()
    const radios = screen.getAllByRole('radio', { name: 'Any (OR)' })
    await userEvent.click(must(radios[0]))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ combinator: 'or' }))
  })

  it('adds and removes conditions', async () => {
    const onChange = vi.fn()
    render(
      <FilterBuilder
        fields={orderFields}
        onChange={onChange}
        maxDepth={1}
      />
    )
    expect(screen.queryByRole('button', { name: 'Add group' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }))
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ rules: [{}, {}] })
    await userEvent.click(screen.getByRole('button', { name: 'Remove Filter, condition 2' }))
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ rules: [{}] })
  })

  it('types a value into a condition', async () => {
    const onChange = vi.fn()
    render(
      <FilterBuilder
        fields={orderFields}
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter, condition 1 value' }), 'acme')
    expect(screen.getByText('Customer contains "acme"')).toBeInTheDocument()
  })
})
