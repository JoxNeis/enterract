import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { LocationLookup } from './LocationLookup'

describe('LocationLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <LocationLookup
        dataSource={instant.location}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Location' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'rack 4')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('A-04-1', expect.objectContaining({ code: 'A-04-1' }))
    expect(input).toHaveValue('A-04-1 · Aisle A, rack 4, level 1')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <LocationLookup
        label='Custom'
        dataSource={instant.location}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
