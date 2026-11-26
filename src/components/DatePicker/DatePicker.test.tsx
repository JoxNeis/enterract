import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '../Calendar'
import { LocaleProvider } from '../LocaleProvider'
import { DatePicker } from './DatePicker'

describe('Calendar', () => {
  it('renders the month and selects a date', async () => {
    const onChange = vi.fn()
    render(
      <Calendar
        defaultValue='2026-03-15'
        today='2026-03-10'
        onChange={onChange}
        locale='en-US'
        className='extra'
      />
    )

    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument()
    expect(screen.getByRole('group')).toHaveClass('erp-calendar', 'extra')
    expect(screen.getByRole('button', { name: /March 10, 2026/ })).toHaveAttribute('aria-current', 'date')
    await userEvent.click(screen.getByRole('button', { name: /March 20, 2026/ }))
    expect(onChange).toHaveBeenCalledWith('2026-03-20', undefined)
  })

  it('moves focus with the keyboard and picks with Enter', async () => {
    const onChange = vi.fn()
    render(
      <Calendar
        defaultValue='2026-03-31'
        onChange={onChange}
        locale='en-US'
        autoFocus
      />
    )

    expect(screen.getByRole('button', { name: /March 31, 2026/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /April 1, 2026/ })).toHaveFocus()
    await userEvent.keyboard('{PageDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('2026-05-01', undefined)
  })

  it('does not pick disabled dates', async () => {
    const onChange = vi.fn()
    render(
      <Calendar
        defaultMonth='2026-03-01'
        min='2026-03-10'
        onChange={onChange}
        locale='en-US'
      />
    )
    const day = screen.getByRole('button', { name: /March 5, 2026/ })
    expect(day).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(day)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('DatePicker', () => {
  it('parses typed dates by locale and emits ISO', async () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        label='Due date'
        onChange={onChange}
        className='extra'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Due date' })
    expect(input).toHaveAttribute('placeholder', 'MM/DD/YYYY')
    await userEvent.type(input, '03/15/2026')
    expect(onChange).toHaveBeenLastCalledWith('2026-03-15', expect.anything())
    expect(input.closest('.erp-form-field')).toHaveClass('extra')
  })

  it('formats in the provider locale', () => {
    render(
      <LocaleProvider locale='de-DE'>
        <DatePicker
          label='Datum'
          defaultValue='2026-03-15'
        />
      </LocaleProvider>
    )
    expect(screen.getByRole('textbox')).toHaveValue('15.03.2026')
  })

  it('keeps invalid text and shows an error', async () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        label='Due'
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('textbox'), '13/45/2026')
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveValue('13/45/2026')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('picks from the calendar with Alt+ArrowDown', async () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        label='Due'
        defaultValue='2026-03-15'
        onChange={onChange}
      />
    )

    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('2026-03-16', undefined)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('reports dates outside min/max', () => {
    render(
      <DatePicker
        label='Due'
        value='2026-01-01'
        min='2026-02-01'
      />
    )
    expect(screen.getByText('Date must be on or after 02/01/2026')).toBeInTheDocument()
  })

  it('is read-only without a calendar button', () => {
    render(
      <DatePicker
        label='Posted'
        defaultValue='2026-03-15'
        readOnly
      />
    )
    expect(screen.queryByRole('button', { name: 'Choose date' })).toBeNull()
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
  })
})
