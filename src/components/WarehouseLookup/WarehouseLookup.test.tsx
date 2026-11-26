import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { WarehouseLookup } from './WarehouseLookup'

describe('WarehouseLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <WarehouseLookup
        dataSource={instant.warehouse}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Warehouse' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'hamburg')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('HAM-01', expect.objectContaining({ code: 'HAM-01' }))
    expect(input).toHaveValue('HAM-01 · Hamburg Port')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <WarehouseLookup
        label='Custom'
        dataSource={instant.warehouse}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
