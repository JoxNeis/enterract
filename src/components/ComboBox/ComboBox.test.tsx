import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComboBox } from './ComboBox'

const terms = [
  { key: 'N30', label: 'Net 30' },
  { key: 'N60', label: 'Net 60' },
  { key: 'COD', label: 'Cash on delivery' },
]

describe('ComboBox', () => {
  it('filters as you type and selects with Enter', async () => {
    const onChange = vi.fn()
    render(
      <ComboBox
        label='Terms'
        options={terms}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Terms' })
    await userEvent.type(input, 'net')
    expect(screen.getAllByRole('option')).toHaveLength(2)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('N60', undefined)
    expect(input).toHaveValue('Net 60')
    expect(input.closest('.erp-form-field')).toHaveClass('erp-combo-box', 'extra')
  })

  it('selects an exact label on blur and reverts other text', async () => {
    const onChange = vi.fn()
    render(
      <ComboBox
        label='Terms'
        options={terms}
        defaultValue='N30'
        onChange={onChange}
      />
    )
    const input = screen.getByRole('combobox')
    await userEvent.clear(input)
    await userEvent.type(input, 'cash on delivery')
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith('COD', undefined)
    await userEvent.clear(input)
    await userEvent.type(input, 'nonsense')
    await userEvent.tab()
    expect(input).toHaveValue('Cash on delivery')
  })

  it('creates values with onCreate', async () => {
    const onChange = vi.fn()
    render(
      <ComboBox
        label='Terms'
        options={terms}
        onChange={onChange}
        onCreate={(text) => `custom:${text}`}
      />
    )
    await userEvent.type(screen.getByRole('combobox'), 'Net 90{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('custom:Net 90', undefined)
  })
})
