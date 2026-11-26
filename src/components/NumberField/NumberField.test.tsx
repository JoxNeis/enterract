import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyField } from '../CurrencyField'
import { LocaleProvider } from '../LocaleProvider'
import { NumberField } from './NumberField'

describe('NumberField', () => {
  it('formats at rest and shows raw text while editing', async () => {
    render(
      <NumberField
        label='Qty'
        defaultValue={1234.5}
        className='extra'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Qty' })
    expect(input).toHaveValue('1,234.5')
    expect(input).toHaveAttribute('data-align', 'end')
    await userEvent.click(input)
    expect(input).toHaveValue('1234.5')
    await userEvent.tab()
    expect(input).toHaveValue('1,234.5')
    expect(input.closest('.erp-form-field')).toHaveClass('erp-number-field', 'extra')
  })

  it('emits parsed numbers', async () => {
    const onChange = vi.fn()
    render(
      <NumberField
        label='Qty'
        onChange={onChange}
      />
    )

    await userEvent.type(screen.getByRole('textbox'), '1,234.50')
    expect(onChange).toHaveBeenLastCalledWith(1234.5, expect.anything())
  })

  it('does not silently coerce invalid text', async () => {
    const onChange = vi.fn()
    render(
      <NumberField
        label='Qty'
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox')
    await userEvent.type(input, '12abc')
    expect(onChange).toHaveBeenLastCalledWith(12, expect.anything())
    expect(onChange).toHaveBeenCalledTimes(2)
    await userEvent.tab()
    expect(input).toHaveValue('12abc')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Enter a valid number')).toBeInTheDocument()
  })

  it('rejects extra decimals instead of rounding', async () => {
    const onChange = vi.fn()
    render(
      <NumberField
        label='Units'
        precision={0}
        onChange={onChange}
      />
    )

    await userEvent.type(screen.getByRole('textbox'), '1.5')
    expect(onChange).not.toHaveBeenCalledWith(1.5, expect.anything())
    expect(screen.getByText('Enter a whole number')).toBeInTheDocument()
  })

  it('parses by locale', async () => {
    const onChange = vi.fn()
    render(
      <LocaleProvider locale='de-DE'>
        <NumberField
          label='Betrag'
          onChange={onChange}
          defaultValue={null}
        />
      </LocaleProvider>
    )

    await userEvent.type(screen.getByRole('textbox'), '1.234,5')
    expect(onChange).toHaveBeenLastCalledWith(1234.5, expect.anything())
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveValue('1.234,5')
  })

  it('steps with arrow keys and the stepper, within min/max', async () => {
    const onChange = vi.fn()
    render(
      <NumberField
        label='Qty'
        defaultValue={1}
        min={0}
        max={2}
        showStepper
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(onChange).toHaveBeenLastCalledWith(2, undefined)
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(onChange).toHaveBeenLastCalledWith(1, undefined)
  })

  it('shows a range error', () => {
    render(
      <NumberField
        label='Discount'
        value={120}
        max={100}
      />
    )
    expect(screen.getByText('Must be at most 100')).toBeInTheDocument()
  })

  it('is read-only and disabled', async () => {
    const onChange = vi.fn()
    render(
      <>
        <NumberField
          label='A'
          defaultValue={5}
          readOnly
          onChange={onChange}
        />
        <NumberField
          label='B'
          disabled
        />
      </>
    )

    await userEvent.type(screen.getByRole('textbox', { name: 'A' }), '1{ArrowUp}')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'B' })).toBeDisabled()
  })
})

describe('CurrencyField', () => {
  it('keeps money as a decimal string and formats with the currency', async () => {
    const onChange = vi.fn()
    render(
      <CurrencyField
        label='Price'
        currency='USD'
        defaultValue='1234.5'
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox', { name: 'Price' })
    expect(input).toHaveValue('$1,234.50')
    await userEvent.clear(input)
    await userEvent.type(input, '0.1')
    expect(onChange).toHaveBeenLastCalledWith('0.1', expect.anything())
  })

  it('accepts pasted text with the symbol and rejects extra decimals', async () => {
    const onChange = vi.fn()
    render(
      <CurrencyField
        label='Price'
        currency='USD'
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.paste('$1,000.25')
    expect(onChange).toHaveBeenLastCalledWith('1000.25', expect.anything())
    await userEvent.type(input, '9')
    expect(screen.getByText('Use at most 2 decimal places')).toBeInTheDocument()
  })

  it('uses zero decimals for JPY and lets the user pick a currency', async () => {
    const onCurrencyChange = vi.fn()
    render(
      <CurrencyField
        label='Amount'
        defaultCurrency='USD'
        currencies={['USD', 'JPY']}
        onCurrencyChange={onCurrencyChange}
        defaultValue='1500'
      />
    )

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Currency' }), 'JPY')
    expect(onCurrencyChange).toHaveBeenCalledWith('JPY', undefined)
    expect(screen.getByRole('textbox')).toHaveValue('1,500')
  })
})
