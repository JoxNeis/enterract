import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Section } from './Section'

describe('Section', () => {
  it('renders a labelled region with description and actions', () => {
    render(
      <Section
        title='Shipping'
        description='Where the goods go'
        actions={<button>Copy from billing</button>}
        className='extra'
      >
        <input aria-label='Street' />
      </Section>
    )
    const region = screen.getByRole('region', { name: 'Shipping' })
    expect(region).toHaveClass('erp-section', 'extra')
    expect(screen.getByText('Where the goods go')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Shipping' })).toBeInTheDocument()
  })

  it('collapses and expands', async () => {
    const onExpandedChange = vi.fn()
    render(
      <Section
        title='Advanced'
        collapsible
        onExpandedChange={onExpandedChange}
      >
        <input aria-label='Field' />
      </Section>
    )
    const toggle = screen.getByRole('button', { name: 'Advanced' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(onExpandedChange).toHaveBeenCalledWith(false, undefined)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('shows an error marker', () => {
    render(
      <Section
        title='Tax'
        invalid
      >
        x
      </Section>
    )
    expect(screen.getByText('(has errors)')).toBeInTheDocument()
  })
})
