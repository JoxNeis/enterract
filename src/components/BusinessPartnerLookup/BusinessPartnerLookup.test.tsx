import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { BusinessPartnerLookup } from './BusinessPartnerLookup'

describe('BusinessPartnerLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <BusinessPartnerLookup
        dataSource={instant.partner}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Business partner' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'group')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('B9001', expect.objectContaining({ code: 'B9001' }))
    expect(input).toHaveValue('B9001 · Global Steel Group')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <BusinessPartnerLookup
        label='Custom'
        dataSource={instant.partner}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
