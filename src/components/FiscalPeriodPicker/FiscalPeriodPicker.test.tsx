import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildFiscalCalendar, periodForDate } from './fiscalCalendar'
import { FiscalPeriodPicker } from './FiscalPeriodPicker'

const calendar = buildFiscalCalendar({ startMonth: 4, firstYear: 2026, count: 2, adjustmentPeriod: true, closedBefore: '2025-06-01' })

describe('buildFiscalCalendar', () => {
  it('builds April–March years with an adjustment period', () => {
    const fy = calendar.years[0]
    expect(fy?.key).toBe('FY2026')
    expect(fy?.periods[0]).toMatchObject({ key: 'FY2026-P01', from: '2025-04-01', to: '2025-04-30', closed: true })
    expect(fy?.periods[11]).toMatchObject({ from: '2026-03-01', to: '2026-03-31' })
    expect(fy?.periods[12]).toMatchObject({ key: 'FY2026-P13', from: '2026-03-31' })
    expect(periodForDate(calendar, '2026-02-14')?.key).toBe('FY2026-P11')
  })
})

describe('FiscalPeriodPicker', () => {
  it('picks an open period', async () => {
    const onChange = vi.fn()
    render(
      <FiscalPeriodPicker
        label='Posting period'
        calendar={calendar}
        defaultYear='FY2026'
        onChange={onChange}
        className='extra'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /posting period/i }))
    expect(screen.getByRole('gridcell', { name: /^P01 · Apr 2025.*closed/ })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('gridcell', { name: /^P03 · Jun 2025/ }))
    expect(onChange).toHaveBeenCalledWith('FY2026-P03', expect.objectContaining({ from: '2025-06-01' }))
    expect(screen.getByRole('button', { name: /posting period/i })).toHaveTextContent('FY 2026 · P03 · Jun 2025')
    expect(screen.getByText('06/01/2025 – 06/30/2025')).toBeInTheDocument()
  })

  it('allows closed periods for reporting and warns', () => {
    render(
      <FiscalPeriodPicker
        label='Report period'
        calendar={calendar}
        allowClosed
        defaultValue='FY2026-P01'
      />
    )
    expect(screen.getByText('This period is closed')).toBeInTheDocument()
  })

  it('moves between fiscal years', async () => {
    render(
      <FiscalPeriodPicker
        label='Period'
        calendar={calendar}
        defaultYear='FY2026'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /period/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Next fiscal year' }))
    expect(screen.getByText('FY 2027')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next fiscal year' })).toBeDisabled()
  })
})
