import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RadioGroup } from '../RadioGroup'
import { Switch } from '../Switch'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('toggles uncontrolled and with Space', async () => {
    const onChange = vi.fn()
    render(
      <Checkbox
        label='Taxable'
        onChange={onChange}
        className='extra'
      />
    )

    const box = screen.getByRole('checkbox', { name: 'Taxable' })
    await userEvent.click(box)
    expect(box).toBeChecked()
    expect(onChange).toHaveBeenLastCalledWith(true, expect.anything())
    await userEvent.keyboard(' ')
    expect(box).not.toBeChecked()
    expect(box.closest('.erp-checkbox')).toHaveClass('extra')
  })

  it('is controlled', async () => {
    const onChange = vi.fn()
    render(
      <Checkbox
        label='Taxable'
        value
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(false, expect.anything())
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('supports indeterminate', () => {
    render(
      <Checkbox
        label='All'
        indeterminate
      />
    )
    expect(screen.getByRole('checkbox')).toHaveProperty('indeterminate', true)
  })

  it('cannot be changed when readOnly or disabled', async () => {
    const onChange = vi.fn()
    render(
      <>
        <Checkbox
          label='A'
          readOnly
          value
          onChange={onChange}
        />
        <Checkbox
          label='B'
          disabled
          onChange={onChange}
        />
      </>
    )

    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'B' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'A' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'A' })).toHaveAttribute('aria-readonly', 'true')
  })

  it('shows errors', () => {
    render(
      <Checkbox
        label='Accept terms'
        required
        error='You must accept'
      />
    )
    const box = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(box).toHaveAccessibleDescription('You must accept')
    expect(box).toHaveAttribute('aria-required', 'true')
  })
})

describe('Switch', () => {
  it('toggles and exposes role switch', async () => {
    const onChange = vi.fn()
    render(
      <Switch
        label='Active'
        onChange={onChange}
      />
    )
    const sw = screen.getByRole('switch', { name: 'Active' })
    await userEvent.click(sw)
    expect(sw).toBeChecked()
    expect(onChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('does not toggle when readOnly', async () => {
    const onChange = vi.fn()
    render(
      <Switch
        label='Active'
        readOnly
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

const terms = [
  { key: 'net30', label: 'Net 30' },
  { key: 'net60', label: 'Net 60', description: 'Needs approval' },
  { key: 'cod', label: 'Cash on delivery', disabled: true },
]

describe('RadioGroup', () => {
  it('is labelled and selects with click and arrows', async () => {
    const onChange = vi.fn()
    render(
      <RadioGroup
        label='Payment terms'
        options={terms}
        onChange={onChange}
        className='extra'
      />
    )

    const group = screen.getByRole('radiogroup', { name: 'Payment terms' })
    expect(group.closest('.erp-form-field')).toHaveClass('extra')
    await userEvent.click(screen.getByRole('radio', { name: 'Net 30' }))
    expect(onChange).toHaveBeenLastCalledWith('net30', expect.anything())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Net 60' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Net 60' })).toHaveAccessibleDescription('Needs approval')
    expect(screen.getByRole('radio', { name: 'Cash on delivery' })).toBeDisabled()
  })

  it('is controlled', async () => {
    const onChange = vi.fn()
    render(
      <RadioGroup
        label='Terms'
        options={terms}
        value='net60'
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Net 30' }))
    expect(onChange).toHaveBeenCalledWith('net30', expect.anything())
    expect(screen.getByRole('radio', { name: 'Net 60' })).toBeChecked()
  })

  it('does not change when readOnly', async () => {
    const onChange = vi.fn()
    render(
      <RadioGroup
        label='Terms'
        options={terms}
        defaultValue='net30'
        readOnly
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Net 60' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true')
  })
})
