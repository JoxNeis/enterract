import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateRangePicker } from './DateRangePicker'
import { defaultRangePresets } from './presets'

const preset = (key: string) => defaultRangePresets.find((p) => p.key === key)?.range('2026-05-15')

describe('range presets', () => {
  it('computes ranges relative to today', () => {
    expect(preset('thisMonth')).toEqual({ from: '2026-05-01', to: '2026-05-31' })
    expect(preset('lastQuarter')).toEqual({ from: '2026-01-01', to: '2026-03-31' })
    expect(preset('ytd')).toEqual({ from: '2026-01-01', to: '2026-05-15' })
  })
})

describe('DateRangePicker', () => {
  it('accepts typed start and end dates', async () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        label='Period'
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Period start' }), '03/01/2026')
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-03-01', to: null })
    await userEvent.type(screen.getByRole('textbox', { name: 'Period end' }), '02/01/2026')
    await userEvent.tab()
    expect(screen.getByText('The start date is after the end date')).toBeInTheDocument()
  })

  it('picks a range with two clicks on the calendar', async () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        label='Period'
        today='2026-03-10'
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Choose dates' }))
    const dialog = screen.getByRole('dialog', { name: 'Choose dates' })
    await userEvent.click(within(dialog).getByRole('button', { name: /March 20, 2026/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: /March 5, 2026/ }))
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-03-05', to: '2026-03-20' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('applies a preset', async () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        label='Period'
        today='2026-05-15'
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Choose dates' }))
    await userEvent.click(screen.getByRole('button', { name: 'Last month' }))
    expect(onChange).toHaveBeenCalledWith({ from: '2026-04-01', to: '2026-04-30' })
  })

  it('is read-only', () => {
    render(
      <DateRangePicker
        label='Period'
        readOnly
        defaultValue={{ from: '2026-03-01', to: '2026-03-31' }}
      />
    )
    expect(screen.queryByRole('button', { name: 'Choose dates' })).toBeNull()
    expect(screen.getByRole('textbox', { name: 'Period start' })).toHaveValue('03/01/2026')
  })
})
