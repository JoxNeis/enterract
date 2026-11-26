import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalPanel } from './ApprovalPanel'
import { pendingSteps, rejectedSteps } from './ApprovalPanel.fixtures'

describe('ApprovalPanel', () => {
  it('shows status, stages and approver decisions', () => {
    render(
      <ApprovalPanel
        status='pending-approval'
        steps={pendingSteps}
        className='extra'
      />
    )
    const region = screen.getByRole('region', { name: 'Approval' })
    expect(region).toHaveClass('erp-approval-panel', 'extra')
    expect(within(region).getByText('Pending approval')).toBeInTheDocument()
    const approvers = within(screen.getByRole('list', { name: 'Approvers' })).getAllByRole('listitem')
    expect(approvers[0]).toHaveTextContent('Approved')
    expect(approvers[1]).toHaveTextContent('Pending')
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()
  })

  it('approves and rejects with a reason when the user can decide', async () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()
    render(
      <ApprovalPanel
        status='pending-approval'
        steps={pendingSteps}
        canDecide
        onApprove={onApprove}
        onReject={onReject}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith(undefined)

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Reject this document?' })
    await userEvent.type(within(dialog).getByRole('textbox'), 'Budget')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('Budget')
  })

  it('marks a rejected workflow', () => {
    render(
      <ApprovalPanel
        status='rejected'
        steps={rejectedSteps}
      />
    )
    expect(screen.getByText(/over the quarterly budget/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').some((li) => li.dataset.state === 'rejected')).toBe(true)
  })
})
