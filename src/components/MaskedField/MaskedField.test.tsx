import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { applyMask, masks, unmask } from './mask'
import { MaskedField } from './MaskedField'

describe('mask helpers', () => {
  it('applies and removes masks', () => {
    expect(applyMask('5551234567', masks.phoneUS)).toEqual({ masked: '(555) 123-4567', raw: '5551234567', complete: true })
    expect(applyMask('555', masks.phoneUS).masked).toBe('(555')
    expect(unmask('(555) 123-4567', masks.phoneUS)).toBe('5551234567')
    expect(applyMask('de89370400440532013000', masks.ibanDE).masked).toBe('DE89 3704 0044 0532 0130 00')
  })

  it('does not lose digits that also appear as literals', () => {
    expect(unmask('+62 812-6', masks.phoneID)).toBe('8126')
    expect(unmask('+62 82-3', masks.phoneID)).toBe('823')
  })
})

describe('MaskedField', () => {
  it('formats while typing and emits raw characters', async () => {
    const onChange = vi.fn()
    render(
      <MaskedField
        label='Phone'
        mask={masks.phoneUS}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('textbox', { name: 'Phone' })
    expect(input).toHaveAttribute('placeholder', '(___) ___-____')
    await userEvent.type(input, '5551234567')
    expect(input).toHaveValue('(555) 123-4567')
    expect(onChange).toHaveBeenLastCalledWith('5551234567', expect.anything())
    expect(input.closest('.erp-form-field')).toHaveClass('extra')
  })

  it('can emit the masked text and flags incomplete values on blur', async () => {
    const onChange = vi.fn()
    render(
      <MaskedField
        label='NPWP'
        mask={masks.npwp}
        valueMode='masked'
        onChange={onChange}
      />
    )
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '0123')
    expect(onChange).toHaveBeenLastCalledWith('01.23', expect.anything())
    await userEvent.tab()
    expect(screen.getByText('Incomplete value')).toBeInTheDocument()
  })

  it('ignores characters that do not fit', async () => {
    render(
      <MaskedField
        label='Zip'
        mask={masks.postalUS}
      />
    )
    await userEvent.type(screen.getByRole('textbox'), '12a34')
    expect(screen.getByRole('textbox')).toHaveValue('1234')
  })
})
