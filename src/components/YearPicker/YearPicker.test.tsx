import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { YearPicker } from './YearPicker'

describe('YearPicker', () => {
  it('picks a year', async () => {
    const onChange = vi.fn()
    render(
      <YearPicker
        label='Budget year'
        currentYear={2026}
        onChange={onChange}
        className='extra'
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /budget year/i }))
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onChange).toHaveBeenCalledWith(2027, undefined)
    expect(screen.getByRole('button', { name: /budget year/i })).toHaveTextContent('2027')
  })

  it('pages by 12 years and respects min', async () => {
    render(
      <YearPicker
        label='Year'
        currentYear={2026}
        min={2020}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /year/i }))
    expect(screen.getByRole('gridcell', { name: '2019' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Next years' }))
    expect(screen.getByRole('gridcell', { name: '2035' })).toBeInTheDocument()
  })
})
