import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GridRow } from '../DataGrid'
import { LineItemGrid } from './LineItemGrid'
import { computeTotals, lineAmount } from './lineTotals'

interface InvoiceLine {
  description: string | null
  qty: number | null
  price: string | null
  discount: number | null
  taxable: boolean
}

const rows: GridRow<InvoiceLine>[] = [
  { id: '1', data: { description: 'Bolts', qty: 3, price: '19.99', discount: null, taxable: true }, meta: undefined, status: 'unchanged' },
  { id: '2', data: { description: 'Service', qty: 1.5, price: '100.00', discount: 10, taxable: false }, meta: undefined, status: 'unchanged' },
]

describe('line totals', () => {
  it('computes line amounts exactly', () => {
    expect(lineAmount({ quantity: 3, price: '19.99' })).toBe('59.97')
    expect(lineAmount({ quantity: 1.5, price: '100.00', discountPercent: 10 })).toBe('135.00')
    expect(lineAmount({ quantity: 0.1, price: '0.2' }, 4)).toBe('0.0200')
    expect(lineAmount({ quantity: null, price: '1' })).toBeNull()
  })

  it('computes document totals with tax on taxable lines only', () => {
    const totals = computeTotals(
      rows.map((r) => ({ quantity: r.data.qty, price: r.data.price, discountPercent: r.data.discount, taxable: r.data.taxable })),
      '0.11'
    )
    expect(totals).toEqual({ gross: '209.97', discount: '15.00', subtotal: '194.97', tax: '6.60', total: '201.57' })
  })
})

describe('LineItemGrid', () => {
  it('renders an amount column and totals', () => {
    render(
      <LineItemGrid<InvoiceLine>
        aria-label='Invoice lines'
        rows={rows}
        columns={[
          { field: 'description', header: 'Description', editor: 'text' },
          { field: 'qty', header: 'Qty', editor: 'number' },
          { field: 'price', header: 'Price', editor: 'currency' },
          { field: 'discount', header: 'Disc %', editor: 'number' },
          { field: 'taxable', header: 'Taxable', editor: 'checkbox' },
        ]}
        quantityField='qty'
        priceField='price'
        discountField='discount'
        taxableField='taxable'
        taxRate='0.11'
        currency='USD'
        className='extra'
      />
    )

    expect(screen.getByRole('gridcell', { name: /^amount, row 1\b/i })).toHaveTextContent('$59.97')
    expect(screen.getByRole('gridcell', { name: /^amount, row 2\b/i })).toHaveTextContent('$135.00')
    const totals = screen.getByLabelText('Totals')
    expect(within(totals).getByText('$201.57')).toBeInTheDocument()
    expect(within(totals).getByText('Tax (11%)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument()
    expect(totals.closest('.erp-line-item-grid')).toHaveClass('extra')
  })
})
