import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuickFilter } from './QuickFilter'

const options = [
  { key: 'open', label: 'Open', count: 128 },
  { key: 'overdue', label: 'Overdue', count: 12 },
  { key: 'mine', label: 'Mine' },
]

describe('QuickFilter', () => {
  it('toggles one chip at a time with an All reset', async () => {
    const onChange = vi.fn()
    render(
      <QuickFilter
        options={options}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Quick filters' })).toHaveClass('erp-quick-filter', 'extra')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: /overdue/i }))
    expect(onChange).toHaveBeenLastCalledWith(['overdue'])
    await userEvent.click(screen.getByRole('button', { name: /open/i }))
    expect(onChange).toHaveBeenLastCalledWith(['open'])
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('allows several in multiple mode', async () => {
    const onChange = vi.fn()
    render(
      <QuickFilter
        options={options}
        multiple
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /open/i }))
    await userEvent.click(screen.getByRole('button', { name: /mine/i }))
    expect(onChange).toHaveBeenLastCalledWith(['open', 'mine'])
    expect(screen.getByRole('button', { name: /open/i })).toHaveTextContent('128')
  })
})
