import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { must } from '../../test/must'
import { ActivityFeed } from './ActivityFeed'
import { activity } from './ActivityFeed.fixtures'

describe('ActivityFeed', () => {
  it('groups by day, newest first, with field changes', () => {
    render(
      <ActivityFeed
        entries={activity}
        className='extra'
      />
    )
    const region = screen.getByRole('region', { name: 'Activity' })
    expect(region).toHaveClass('erp-activity-feed', 'extra')
    const days = within(region).getAllByRole('heading', { level: 4 })
    expect(days.map((d) => d.textContent)).toEqual(['Sunday, March 15, 2026', 'Saturday, March 14, 2026'])
    const items = within(region).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Markus Weber changed shipping address')
    expect(within(must(items[0])).getByRole('rowheader', { name: 'City' })).toBeInTheDocument()
  })

  it('loads more', async () => {
    const onLoadMore = vi.fn()
    render(
      <ActivityFeed
        entries={activity}
        hasMore
        onLoadMore={onLoadMore}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Load older activity' }))
    expect(onLoadMore).toHaveBeenCalled()
  })

  it('shows an empty state', () => {
    render(<ActivityFeed entries={[]} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })
})
