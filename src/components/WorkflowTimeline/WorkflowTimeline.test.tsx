import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorkflowTimeline } from './WorkflowTimeline'
import { timelineEvents } from './WorkflowTimeline.fixtures'

describe('WorkflowTimeline', () => {
  it('lists events with state text, actor and time', () => {
    render(
      <WorkflowTimeline
        events={timelineEvents}
        className='extra'
      />
    )
    const list = screen.getByRole('list', { name: 'Workflow history' })
    expect(list).toHaveClass('erp-workflow-timeline', 'extra')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('Done')
    expect(items[2]).toHaveTextContent('Rudi Hartono · Mar 15, 2026, 9:10 AM')
    expect(items[3]).toHaveAttribute('aria-current', 'step')
    expect(items[3]).toHaveTextContent('In progress')
  })

  it('shows rejection', () => {
    render(<WorkflowTimeline events={[{ id: 'x', title: 'Finance approval', state: 'rejected', comment: 'Over budget' }]} />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByText('Over budget')).toBeInTheDocument()
  })
})
