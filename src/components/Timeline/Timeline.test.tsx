import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Timeline } from './Timeline'
import { contractMilestones } from './Timeline.fixtures'

describe('Timeline', () => {
  it('lists milestones in date order with status text', () => {
    render(
      <Timeline
        aria-label='Contract milestones'
        items={[...contractMilestones].reverse()}
        today='2026-03-16'
        className='extra'
      />
    )
    const list = screen.getByRole('list', { name: 'Contract milestones' })
    expect(list.parentElement).toHaveClass('erp-timeline', 'extra')
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Contract signed')
    expect(items[2]).toHaveTextContent('Go-live')
    expect(items[2]).toHaveTextContent('At risk')
    expect(items[0]).toHaveAttribute('data-past', 'true')
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('positions items on a scaled axis', () => {
    render(
      <Timeline
        aria-label='M'
        items={contractMilestones}
        from='2026-01-01'
        to='2026-07-01'
      />
    )
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items[0]?.style.left).toMatch(/^7\.7/)
  })

  it('renders vertically', () => {
    render(
      <Timeline
        aria-label='M'
        items={contractMilestones}
        orientation='vertical'
      />
    )
    expect(screen.getByRole('list').parentElement).toHaveAttribute('data-orientation', 'vertical')
  })
})
