import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DrillLink } from './DrillLink'

describe('DrillLink', () => {
  it('is a button that drills down with Enter', async () => {
    const onDrill = vi.fn()
    render(
      <DrillLink
        target='Open orders'
        onDrill={onDrill}
        className='extra'
      >
        42
      </DrillLink>
    )
    const button = screen.getByRole('button', { name: /view details for open orders/i })
    expect(button).toHaveClass('erp-drill-link', 'extra')
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(onDrill).toHaveBeenCalled()
  })
})
