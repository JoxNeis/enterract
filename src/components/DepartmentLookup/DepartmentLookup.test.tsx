import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { DepartmentLookup } from './DepartmentLookup'

describe('DepartmentLookup', () => {
  it('searches, shows the preset columns and picks a record', async () => {
    const onChange = vi.fn()
    render(
      <DepartmentLookup
        dataSource={instant.department}
        debounce={0}
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Department' })
    expect(input.closest('.erp-form-field')).toHaveClass('erp-lookup', 'extra')
    await userEvent.type(input, 'purch')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('D11', expect.objectContaining({ code: 'D11' }))
    expect(input).toHaveValue('Purchasing')
  })

  it('accepts a custom label and is read-only', () => {
    render(
      <DepartmentLookup
        label='Custom'
        dataSource={instant.department}
        readOnly
      />
    )
    expect(screen.getByRole('combobox', { name: 'Custom' })).toHaveAttribute('readonly')
  })
})
