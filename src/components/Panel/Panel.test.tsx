import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Panel } from './Panel'

describe('Panel', () => {
  it('renders header, body and footer', () => {
    render(
      <Panel
        title='Totals'
        actions={<button>Recalculate</button>}
        footer='Footer'
        className='extra'
      >
        Body
      </Panel>
    )
    const region = screen.getByRole('region', { name: 'Totals' })
    expect(region).toHaveClass('erp-panel', 'extra')
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('collapses', async () => {
    const onExpandedChange = vi.fn()
    render(
      <Panel
        title='Details'
        collapsible
        onExpandedChange={onExpandedChange}
      >
        Body
      </Panel>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(onExpandedChange).toHaveBeenCalledWith(false, undefined)
    expect(screen.getByText('Body')).not.toBeVisible()
  })
})
