import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { CustomerLookup } from './CustomerLookup'

describe('CustomerLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <CustomerLookup
        dataSource={instant.customer}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Customer' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'harbor')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('C1008', expect.objectContaining({ code: 'C1008' }))
    expect(input).toHaveValue('C1008 · Harbor Marine')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <CustomerLookup
        label='Custom'
        dataSource={instant.customer}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
