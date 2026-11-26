import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('shows counts and caps at max', () => {
    render(
      <>
        <Badge
          count={5}
          className='extra'
        />
        <Badge count={250} />
      </>
    )
    expect(screen.getByText('5')).toHaveClass('erp-badge', 'extra')
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('hides zero unless asked and supports a dot', () => {
    const { container } = render(
      <>
        <Badge count={0} />
        <Badge
          count={0}
          showZero
        />
        <Badge
          dot
          aria-label='New'
          tone='danger'
        />
      </>
    )
    expect(container.querySelectorAll('.erp-badge')).toHaveLength(2)
    expect(screen.getByLabelText('New')).toHaveAttribute('data-dot', 'true')
  })
})
