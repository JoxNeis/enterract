import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimePicker } from './TimePicker'
import { timeOptions } from './timeOptions'

describe('timeOptions', () => {
  it('steps through the day within min/max', () => {
    expect(timeOptions(60, '08:00', '10:00')).toEqual(['08:00', '09:00', '10:00'])
    expect(timeOptions(30)).toHaveLength(48)
  })
})

describe('TimePicker', () => {
  it('parses typed times and shows the locale format', async () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        label='Pickup'
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Pickup' })
    await userEvent.type(input, '2:30 pm')
    expect(onChange).toHaveBeenLastCalledWith('14:30', expect.anything())
    await userEvent.keyboard('{Escape}')
    await userEvent.tab()
    expect(input).toHaveValue('2:30 PM')
    expect(input.closest('.erp-form-field')).toHaveClass('erp-time-picker', 'extra')
  })

  it('picks from the list with the keyboard', async () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        label='Start'
        step={60}
        defaultValue='09:00'
        onChange={onChange}
        locale='de-DE'
      />
    )
    screen.getByRole('combobox').focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('10:00', undefined)
    expect(screen.getByRole('combobox')).toHaveValue('10:00')
  })

  it('flags invalid and out-of-range times', () => {
    render(
      <TimePicker
        label='Start'
        min='08:00'
        max='17:00'
        defaultValue='18:00'
      />
    )
    expect(screen.getByText(/choose a time between/i)).toBeInTheDocument()
  })

  it('is read-only', async () => {
    render(
      <TimePicker
        label='Start'
        readOnly
      />
    )
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
