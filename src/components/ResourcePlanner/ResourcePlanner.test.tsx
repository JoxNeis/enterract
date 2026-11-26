import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { dayLoad } from './dayLoad'
import { ResourcePlanner } from './ResourcePlanner'
import { bookings, consultants } from './ResourcePlanner.fixtures'

describe('dayLoad', () => {
  it('sums hours and skips weekends', () => {
    expect(dayLoad(bookings, 'r1', '2026-03-18')).toBe(10)
    expect(dayLoad(bookings, 'r2', '2026-03-21')).toBe(0)
    expect(dayLoad(bookings, 'r2', '2026-03-21', true)).toBe(8)
  })
})

describe('ResourcePlanner', () => {
  it('shows load per day and flags over-allocation in text', () => {
    render(
      <ResourcePlanner
        aria-label='Consultants'
        resources={consultants}
        allocations={bookings}
        start='2026-03-16'
        days={14}
        today='2026-03-16'
        className='extra'
      />
    )
    expect(screen.getByRole('table', { name: 'Consultants' }).parentElement).toHaveClass('erp-resource-planner', 'extra')
    expect(screen.getByRole('cell', { name: 'Dewi Lestari, Wednesday, Mar 18: 10 of 8 hours, over-allocated' })).toHaveAttribute('data-over', 'true')
    expect(screen.getByRole('button', { name: 'Acme rollout, Dewi Lestari, 03/16/2026 to 03/20/2026, 6 hours a day' })).toBeInTheDocument()
    expect(screen.getByText('48% booked')).toBeInTheDocument()
  })

  it('opens allocations and creates from empty cells with the keyboard', async () => {
    const onAllocationClick = vi.fn()
    const onCellClick = vi.fn()
    render(
      <ResourcePlanner
        aria-label='Consultants'
        resources={consultants}
        allocations={bookings}
        start='2026-03-16'
        onAllocationClick={onAllocationClick}
        onCellClick={onCellClick}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^Support/ }))
    expect(onAllocationClick).toHaveBeenCalledWith(bookings[1])
    screen.getByRole('cell', { name: /^Siti Rahma, Wednesday, Mar 25/ }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onCellClick).toHaveBeenCalledWith('r3', '2026-03-25')
  })
})
