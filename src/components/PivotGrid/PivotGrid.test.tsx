import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { pivot } from './pivot'
import { PivotGrid } from './PivotGrid'
import { salesConfig, salesFieldLabels, salesRecords } from './PivotGrid.fixtures'

describe('pivot', () => {
  it('aggregates with subtotals and totals', () => {
    const r = pivot(salesRecords, salesConfig)
    expect(r.colKeys).toEqual([['Q1'], ['Q2']])
    expect(r.rowKeys[0]).toEqual(['Hamburg'])
    expect(r.cell(['Jakarta', 'Tools'], ['Q2']).values).toEqual([1350])
    expect(r.cell(['Jakarta'], ['Q1']).values).toEqual([1000 + 1250 + 1500])
    expect(r.cell([], []).values).toEqual([salesRecords.reduce((s, x) => s + x.revenue, 0)])
  })

  it('supports count and average', () => {
    const r = pivot(salesRecords, { rows: ['region'], columns: [], values: [{ field: 'orders', aggregate: 'avg' }, { field: 'orders', aggregate: 'count' }] })
    expect(r.cell(['Jakarta'], []).values).toEqual([4.5, 6])
  })
})

describe('PivotGrid', () => {
  it('renders the cross-tab and collapses groups', async () => {
    render(
      <PivotGrid
        aria-label='Revenue by region'
        data={salesRecords}
        config={salesConfig}
        fieldLabels={salesFieldLabels}
        className='extra'
      />
    )
    const table = screen.getByRole('grid', { name: 'Revenue by region' })
    expect(table.closest('.erp-pivot-grid')).toHaveClass('extra')
    expect(within(table).getByRole('columnheader', { name: 'Region / Category' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'Grand total' })).toBeInTheDocument()
    const toggle = within(table).getByRole('button', { name: 'Jakarta' })
    expect(within(table).getAllByRole('rowheader', { name: 'Tools' })).toHaveLength(3)
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(table).getAllByRole('rowheader', { name: 'Tools' })).toHaveLength(2)
  })
})
