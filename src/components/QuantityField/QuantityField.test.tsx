import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuantityField } from './QuantityField'

const units = [
  { key: 'PCS', label: 'Pieces' },
  { key: 'KG', label: 'Kilogram' },
]

describe('QuantityField', () => {
  it('shows a fixed unit', () => {
    render(
      <QuantityField
        label='Qty'
        unit='PCS'
        defaultValue={12}
        className='extra'
      />
    )
    expect(screen.getByText('PCS')).toBeInTheDocument()
    expect(screen.getByRole('textbox').closest('.erp-form-field')).toHaveClass('erp-quantity-field', 'extra')
  })

  it('switches units and precision', async () => {
    const onUnitChange = vi.fn()
    const onChange = vi.fn()
    render(
      <QuantityField
        label='Qty'
        units={units}
        unitPrecision={{ PCS: 0, KG: 3 }}
        onUnitChange={onUnitChange}
        onChange={onChange}
      />
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Qty' }), '1.5')
    expect(screen.getByText('Enter a whole number')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Unit of measure' }), 'KG')
    expect(onUnitChange).toHaveBeenCalledWith('KG', undefined)
    await userEvent.type(screen.getByRole('textbox', { name: 'Qty' }), '2')
    expect(onChange).toHaveBeenLastCalledWith(1.52, expect.anything())
  })

  it('locks the unit when read-only', () => {
    render(
      <QuantityField
        label='Qty'
        units={units}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Unit of measure' })).toBeDisabled()
  })
})
