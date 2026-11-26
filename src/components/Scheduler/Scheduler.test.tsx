import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { layoutDay } from './layoutDay'
import { Scheduler } from './Scheduler'
import { dockEvents } from './Scheduler.fixtures'

describe('layoutDay', () => {
  it('puts overlapping events side by side', () => {
    const placed = layoutDay(dockEvents.filter((e) => e.start.startsWith('2026-03-16')))
    expect(placed.map((p) => [p.event.id, p.lane, p.lanes])).toEqual([
      ['e1', 0, 2],
      ['e2', 1, 2],
    ])
  })
})

describe('Scheduler', () => {
  it('shows the work week with events as buttons', () => {
    render(
      <Scheduler
        aria-label='Dock schedule'
        events={dockEvents}
        defaultDate='2026-03-18'
        today='2026-03-16'
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Dock schedule' })).toHaveClass('erp-scheduler', 'extra')
    const monday = screen.getByRole('region', { name: 'Monday, March 16' })
    expect(within(monday).getByRole('button', { name: 'Inbound: Global Steel, 8:00 AM – 9:30 AM, Dock 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mar 16 – Mar 20, 2026/ })).toBeInTheDocument()
  })

  it('navigates weeks and switches views', async () => {
    const onDateChange = vi.fn()
    render(
      <Scheduler
        aria-label='Dock schedule'
        events={dockEvents}
        defaultDate='2026-03-18'
        today='2026-03-16'
        onDateChange={onDateChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(onDateChange).toHaveBeenLastCalledWith('2026-03-25', undefined)
    await userEvent.click(screen.getByRole('radio', { name: 'Day' }))
    expect(screen.getAllByRole('region')).toHaveLength(1)
  })

  it('creates from a slot and opens events', async () => {
    const onSlotClick = vi.fn()
    const onEventClick = vi.fn()
    render(
      <Scheduler
        aria-label='Dock schedule'
        events={dockEvents}
        defaultDate='2026-03-18'
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Tuesday 10:30 AM, new event' }))
    expect(onSlotClick).toHaveBeenCalledWith('2026-03-17T10:30')
    await userEvent.click(screen.getByRole('button', { name: /^Forklift maintenance/ }))
    expect(onEventClick).toHaveBeenCalledWith(dockEvents[2])
  })
})
