import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Widget } from './Widget'

describe('Widget', () => {
  it('renders title, content, menu and footer', async () => {
    const onMenuSelect = vi.fn()
    render(
      <Widget
        title='Top customers'
        subtitle='This quarter'
        footer='Updated 09:30'
        menuItems={[{ key: 'refresh', label: 'Refresh' }]}
        onMenuSelect={onMenuSelect}
        className='extra'
      >
        Content
      </Widget>
    )
    const region = screen.getByRole('region', { name: 'Top customers' })
    expect(region).toHaveClass('erp-widget', 'extra')
    await userEvent.click(screen.getByRole('button', { name: 'Top customers options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Refresh' }))
    expect(onMenuSelect).toHaveBeenCalledWith('refresh')
  })

  it('shows loading and error with retry', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(
      <Widget
        title='Sales'
        loading
      >
        Data
      </Widget>
    )
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true')
    rerender(
      <Widget
        title='Sales'
        error='Could not load sales'
        onRetry={onRetry}
      >
        Data
      </Widget>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
