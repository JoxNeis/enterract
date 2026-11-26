import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateTimePicker } from './DateTimePicker'

describe('DateTimePicker', () => {
  it('shows an instant in the given time zone', () => {
    render(
      <DateTimePicker
        label='Meeting'
        timeZone='Asia/Jakarta'
        defaultValue='2026-03-15T02:30:00Z'
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Meeting' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Meeting date' })).toHaveValue('03/15/2026')
    expect(screen.getByRole('combobox', { name: 'Meeting time' })).toHaveValue('9:30 AM')
    expect(screen.getByTitle('Asia/Jakarta')).toBeInTheDocument()
  })

  it('emits ISO 8601 with the zone offset', async () => {
    const onChange = vi.fn()
    render(
      <DateTimePicker
        label='Delivery window'
        timeZone='Europe/Berlin'
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Delivery window date' }), '07/01/2026')
    expect(onChange).toHaveBeenLastCalledWith('2026-07-01T09:00:00+02:00', undefined)
    const time = screen.getByRole('combobox', { name: 'Delivery window time' })
    await userEvent.clear(time)
    await userEvent.type(time, '14:15')
    expect(onChange).toHaveBeenLastCalledWith('2026-07-01T14:15:00+02:00', undefined)
  })

  it('is disabled', () => {
    render(
      <DateTimePicker
        label='When'
        disabled
      />
    )
    expect(screen.getByRole('textbox', { name: 'When date' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'When time' })).toBeDisabled()
  })
})
