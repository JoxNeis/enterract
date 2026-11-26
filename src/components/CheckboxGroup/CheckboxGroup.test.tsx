import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CheckboxGroup } from './CheckboxGroup'

const options = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'fax', label: 'Fax', disabled: true },
]

describe('CheckboxGroup', () => {
  it('toggles values in a labelled group', async () => {
    const onChange = vi.fn()
    render(
      <CheckboxGroup
        label='Notify by'
        options={options}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Notify by' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    expect(onChange).toHaveBeenLastCalledWith(['email', 'sms'])
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onChange).toHaveBeenLastCalledWith(['sms'])
    expect(screen.getByRole('checkbox', { name: 'Fax' })).toBeDisabled()
  })

  it('selects all enabled options', async () => {
    const onChange = vi.fn()
    render(
      <CheckboxGroup
        label='Channels'
        options={options}
        selectAll
        defaultValue={['email']}
        onChange={onChange}
      />
    )
    const all = screen.getByRole('checkbox', { name: 'Select all' })
    expect(all).toHaveProperty('indeterminate', true)
    await userEvent.click(all)
    expect(onChange).toHaveBeenLastCalledWith(['email', 'sms'])
  })

  it('is read-only', async () => {
    const onChange = vi.fn()
    render(
      <CheckboxGroup
        label='Channels'
        options={options}
        readOnly
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
