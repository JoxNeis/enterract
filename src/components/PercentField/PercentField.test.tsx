import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PercentField } from './PercentField'

describe('PercentField', () => {
  it('stores a fraction and shows percent', async () => {
    const onChange = vi.fn()
    render(
      <PercentField
        label='Discount'
        defaultValue={0.15}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('textbox', { name: 'Discount' })
    expect(input).toHaveValue('15')
    expect(screen.getByText('%')).toBeInTheDocument()
    await userEvent.clear(input)
    await userEvent.type(input, '7.5')
    expect(onChange).toHaveBeenLastCalledWith(0.075, expect.anything())
    expect(input.closest('.erp-form-field')).toHaveClass('erp-percent-field', 'extra')
  })

  it('can store percent numbers', async () => {
    const onChange = vi.fn()
    render(
      <PercentField
        label='Tax'
        valueMode='percent'
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('textbox'), '11')
    expect(onChange).toHaveBeenLastCalledWith(11, expect.anything())
  })

  it('is read-only', () => {
    render(
      <PercentField
        label='Tax'
        value={0.11}
        readOnly
      />
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    expect(screen.getByRole('textbox')).toHaveValue('11')
  })
})
