import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Accordion } from './Accordion'

const items = [
  { key: 'general', title: 'General', content: 'General content' },
  { key: 'tax', title: 'Tax', content: 'Tax content', invalid: true },
  { key: 'audit', title: 'Audit', content: 'Audit content', disabled: true },
  { key: 'notes', title: 'Notes', content: 'Notes content', meta: '3' },
]

describe('Accordion', () => {
  it('opens one section at a time by default', async () => {
    const onExpandedChange = vi.fn()
    render(
      <Accordion
        items={items}
        defaultExpanded={['general']}
        onExpandedChange={onExpandedChange}
        className='extra'
      />
    )
    expect(screen.getByRole('region', { name: 'General' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /^tax/i }))
    expect(onExpandedChange).toHaveBeenLastCalledWith(['tax'])
    expect(screen.queryByText('General content')).not.toBeVisible()
    expect(screen.getByRole('button', { name: /tax \(has errors\)/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /^general/i }).closest('.erp-accordion')).toHaveClass('extra')
  })

  it('allows multiple and moves focus with arrows, skipping disabled', async () => {
    render(
      <Accordion
        items={items}
        allowMultiple
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^general/i }))
    await userEvent.click(screen.getByRole('button', { name: /^notes/i }))
    expect(screen.getByText('General content')).toBeVisible()
    expect(screen.getByText('Notes content')).toBeVisible()
    screen.getByRole('button', { name: /^tax/i }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /^notes/i })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('button', { name: /^general/i })).toHaveFocus()
  })
})
