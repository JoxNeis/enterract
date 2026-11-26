import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryCard } from './SummaryCard'

describe('SummaryCard', () => {
  it('lists formatted figures', () => {
    render(
      <SummaryCard
        title='Customer balance'
        className='extra'
        items={[
          { label: 'Credit limit', value: '50000', type: 'currency' },
          { label: 'Open invoices', value: '12480.5', type: 'currency' },
          { label: 'Available', value: '37519.5', type: 'currency', emphasis: true },
        ]}
        footer={<a href='#x'>View statement</a>}
      />
    )
    const card = screen.getByRole('region', { name: 'Customer balance' })
    expect(card).toHaveClass('erp-summary-card', 'extra')
    expect(screen.getByRole('group', { name: 'Available' })).toHaveTextContent('$37,519.50')
    expect(screen.getByRole('link', { name: 'View statement' })).toBeInTheDocument()
  })
})
