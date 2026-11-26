import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SidePanel } from './SidePanel'

describe('SidePanel', () => {
  it('is a labelled complementary region that collapses', async () => {
    const onOpenChange = vi.fn()
    render(
      <SidePanel
        title='Comments'
        onOpenChange={onOpenChange}
        className='extra'
      >
        Panel body
      </SidePanel>
    )
    const aside = screen.getByRole('complementary', { name: 'Comments' })
    expect(aside).toHaveClass('erp-side-panel', 'extra')
    await userEvent.click(screen.getByRole('button', { name: 'Collapse panel' }))
    expect(onOpenChange).toHaveBeenCalledWith(false, undefined)
    expect(screen.getByText('Panel body')).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Expand panel' })).toHaveAttribute('aria-expanded', 'false')
  })
})
