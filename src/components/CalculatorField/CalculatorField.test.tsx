import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CalculatorField } from './CalculatorField'
import { evaluateExpression } from './expression'

describe('evaluateExpression', () => {
  it('evaluates arithmetic with precedence and parentheses', () => {
    expect(evaluateExpression('12*3.5')).toBe(42)
    expect(evaluateExpression('2+3*4')).toBe(14)
    expect(evaluateExpression('(2+3)*4')).toBe(20)
    expect(evaluateExpression('-5+2')).toBe(-3)
    expect(evaluateExpression('0.1+0.2')).toBe(0.3)
    expect(evaluateExpression('12*3,5', 'de-DE')).toBe(42)
    expect(evaluateExpression('1,200 / 4')).toBe(300)
  })

  it('rejects invalid input and division by zero', () => {
    expect(evaluateExpression('2+')).toBeNull()
    expect(evaluateExpression('1/0')).toBeNull()
    expect(evaluateExpression('alert(1)')).toBeNull()
    expect(evaluateExpression('')).toBeNull()
  })
})

describe('CalculatorField', () => {
  it('evaluates on Enter and on blur', async () => {
    const onChange = vi.fn()
    render(
      <CalculatorField
        label='Amount'
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await userEvent.type(input, '=12*3.5{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(42, undefined)
    await userEvent.clear(input)
    await userEvent.type(input, '100/8')
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(12.5, undefined)
    expect(input).toHaveValue('12.5')
    expect(input.closest('.erp-form-field')).toHaveClass('erp-calculator-field', 'extra')
  })

  it('shows an error for invalid expressions', async () => {
    render(<CalculatorField label='Amount' />)
    await userEvent.type(screen.getByRole('textbox'), '2**{Enter}')
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('rounds to precision and is read-only', () => {
    render(
      <CalculatorField
        label='Amount'
        value={10}
        readOnly
      />
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
  })
})
