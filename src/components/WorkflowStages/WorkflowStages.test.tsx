import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorkflowStages } from './WorkflowStages'

describe('WorkflowStages', () => {
  it('marks completed, current and upcoming stages', () => {
    render(
      <WorkflowStages
        current='approved'
        className='extra'
      />
    )
    const list = screen.getByRole('list', { name: 'Workflow stages' })
    expect(list).toHaveClass('erp-workflow-stages', 'extra')
    const steps = screen.getAllByRole('listitem')
    expect(steps.map((s) => s.dataset.state)).toEqual(['complete', 'complete', 'current', 'upcoming'])
    expect(steps[2]).toHaveAttribute('aria-current', 'step')
    expect(steps[2]).toHaveTextContent('Approved, current')
  })

  it('shows a rejected stage and custom stages', () => {
    render(
      <WorkflowStages
        stages={[
          { key: 'requested', label: 'Requested' },
          { key: 'review', label: 'Review' },
        ]}
        current='review'
        currentState='rejected'
      />
    )
    expect(screen.getByText('Review').closest('li')).toHaveAttribute('data-state', 'rejected')
  })
})
