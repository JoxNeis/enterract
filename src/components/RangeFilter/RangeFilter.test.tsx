import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RangeFilter } from './RangeFilter'

describe('RangeFilter', () => {
  it('emits a from/to number range', async () => {
    const onChange = vi.fn()
    render(
      <RangeFilter
        type='number'
        label='Amount'
        onChange={onChange}
        className='extra'
      />
    )

    expect(screen.getByRole('group', { name: 'Amount' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount From' }), '100')
    expect(onChange).toHaveBeenLastCalledWith({ from: 100, to: null }, undefined)
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount To' }), '50')
    expect(screen.getByText('The start is after the end')).toBeInTheDocument()
  })

  it('works with dates', () => {
    render(
      <RangeFilter
        type='date'
        label='Order date'
        defaultValue={{ from: '2026-03-01', to: '2026-03-31' }}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Order date From' })).toHaveValue('03/01/2026')
    expect(screen.getByRole('textbox', { name: 'Order date To' })).toHaveValue('03/31/2026')
  })

  it('compares currency amounts exactly and passes disabled', () => {
    render(
      <RangeFilter
        type='currency'
        label='Total'
        currency='USD'
        value={{ from: '10.50', to: '10.05' }}
        disabled
      />
    )
    expect(screen.getByText('The start is after the end')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Total From' })).toBeDisabled()
  })
})
