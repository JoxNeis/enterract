import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Breadcrumb } from './Breadcrumb'

describe('Breadcrumb', () => {
  it('marks the current page', () => {
    render(
      <Breadcrumb
        className='extra'
        items={[
          { key: 'home', label: 'Home', href: '/' },
          { key: 'sales', label: 'Sales', href: '/sales' },
          { key: 'so', label: 'SO-1043' },
        ]}
      />
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toHaveClass('erp-breadcrumb', 'extra')
    expect(within(nav).getByRole('link', { name: 'Sales' })).toHaveAttribute('href', '/sales')
    expect(within(nav).getByText('SO-1043')).toHaveAttribute('aria-current', 'page')
  })

  it('uses onNavigate for router links and collapses long trails', async () => {
    const onNavigate = vi.fn()
    render(
      <Breadcrumb
        maxItems={3}
        items={[
          { key: '1', label: 'Home', onNavigate },
          { key: '2', label: 'Finance' },
          { key: '3', label: 'Ledger' },
          { key: '4', label: 'Accounts' },
          { key: '5', label: '1110 Cash' },
        ]}
      />
    )
    await userEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(onNavigate).toHaveBeenCalled()
    expect(screen.queryByText('Finance')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Show 3 more levels' }))
    expect(screen.getByRole('menuitem', { name: 'Ledger' })).toBeInTheDocument()
  })
})
