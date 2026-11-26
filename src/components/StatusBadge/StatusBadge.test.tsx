import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('maps standard statuses to label and tone', () => {
    render(
      <StatusBadge
        status='pending-approval'
        className='extra'
      />
    )
    const badge = screen.getByText('Pending approval')
    expect(badge).toHaveAttribute('data-tone', 'warning')
    expect(badge).toHaveClass('erp-status-badge', 'extra')
  })

  it('uses a custom map and humanizes unknown keys', () => {
    render(
      <>
        <StatusBadge
          status='qc'
          statusMap={{ qc: { label: 'Quality check', tone: 'info' } }}
        />
        <StatusBadge status='awaiting_stock' />
      </>
    )
    expect(screen.getByText('Quality check')).toHaveAttribute('data-tone', 'info')
    expect(screen.getByText('Awaiting stock')).toHaveAttribute('data-tone', 'neutral')
  })

  it('allows overrides', () => {
    render(
      <StatusBadge
        status='posted'
        label='Booked'
        tone='progress'
        variant='solid'
      />
    )
    expect(screen.getByText('Booked')).toHaveAttribute('data-variant', 'solid')
  })
})
