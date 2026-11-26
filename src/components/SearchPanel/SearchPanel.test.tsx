import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchPanel } from './SearchPanel'

describe('SearchPanel', () => {
  it('searches on Enter with the chosen scope', async () => {
    const onSearch = vi.fn()
    render(
      <SearchPanel
        onSearch={onSearch}
        scopes={[
          { key: 'customer', label: 'Customer' },
          { key: 'docNo', label: 'Order no.' },
        ]}
        className='extra'
      />
    )
    expect(screen.getByRole('search')).toHaveClass('erp-search-panel', 'extra')
    await userEvent.click(screen.getByRole('combobox', { name: 'Search in' }))
    await userEvent.click(screen.getByRole('option', { name: 'Order no.' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'SO-10{Enter}')
    expect(onSearch).toHaveBeenLastCalledWith({ text: 'SO-10', scope: 'docNo' })
  })

  it('toggles advanced filters', async () => {
    render(
      <SearchPanel
        onSearch={vi.fn()}
        advanced={<p>Advanced</p>}
        activeFilterCount={2}
      />
    )
    const toggle = screen.getByRole('button', { name: /filters/i })
    expect(toggle).toHaveTextContent('2')
    expect(screen.getByText('Advanced')).not.toBeVisible()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Advanced')).toBeVisible()
  })
})
