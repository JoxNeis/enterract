import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('shows value, delta with meaning in text and trend', () => {
    render(
      <KpiCard
        label='Revenue (MTD)'
        value='$248,900'
        delta={0.077}
        deltaLabel='vs last month'
        trend={[182, 196, 214, 205, 231, 248]}
        className='extra'
      />
    )
    const card = screen.getByRole('region', { name: 'Revenue (MTD)' })
    expect(card).toHaveClass('erp-kpi-card', 'extra')
    expect(card).toHaveTextContent('+7.7 %')
    expect(card).toHaveTextContent('(improvement)')
    expect(card).toHaveTextContent('Trend over 6 periods, from 182 to 248.')
  })

  it('treats a rise as bad when down is good', () => {
    render(
      <KpiCard
        label='Overdue'
        value='$48,210'
        delta={0.12}
        goodDirection='down'
      />
    )
    expect(screen.getByText('(worse)')).toBeInTheDocument()
  })

  it('drills down', async () => {
    const onDrill = vi.fn()
    render(
      <KpiCard
        label='Open orders'
        value={128}
        onDrill={onDrill}
      />
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onDrill).toHaveBeenCalled()
  })
})
