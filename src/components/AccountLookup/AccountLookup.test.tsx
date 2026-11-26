import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { AccountLookup } from './AccountLookup'

describe('AccountLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <AccountLookup
        dataSource={instant.account}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Account' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'rent')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('6200', expect.objectContaining({ number: '6200' }))
    expect(input).toHaveValue('6200 · Rent')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <AccountLookup
        label='Custom'
        dataSource={instant.account}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
