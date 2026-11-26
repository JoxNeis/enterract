import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonthPicker } from './MonthPicker'

describe('MonthPicker', () => {
  it('opens a month grid and picks with the keyboard', async () => {
    const onChange = vi.fn()
    render(
      <MonthPicker
        label='Reporting month'
        defaultValue='2026-03-01'
        onChange={onChange}
        className='extra'
      />
    )
    const trigger = screen.getByRole('button', { name: /reporting month/i })
    expect(trigger).toHaveTextContent('March 2026')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('gridcell', { name: 'March 2026' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('2026-06-01', undefined)
    expect(trigger).toHaveFocus()
  })

  it('pages years and respects min/max', async () => {
    render(
      <MonthPicker
        label='Month'
        today='2026-03-10'
        min='2026-02-01'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /month/i }))
    expect(screen.getByRole('gridcell', { name: 'January 2026' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Next year' }))
    expect(screen.getByRole('gridcell', { name: 'January 2027' })).not.toHaveAttribute('aria-disabled')
  })

  it('does not open when read-only', async () => {
    render(
      <MonthPicker
        label='Month'
        readOnly
        defaultValue='2026-03-01'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /month/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
