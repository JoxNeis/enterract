import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { instant } from '../../test/erpFixtures'
import { ApproverPicker } from './ApproverPicker'

describe('ApproverPicker', () => {
  it('adds, orders and removes approvers', async () => {
    const onChange = vi.fn()
    render(
      <ApproverPicker
        label='Approvers'
        dataSource={instant.employee}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Approvers' })).toBeInTheDocument()
    const add = screen.getByRole('combobox', { name: 'Add approver' })
    await userEvent.type(add, 'anna')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(['E305'])
    await userEvent.type(add, 'rudi')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(['E305', 'E304'])
    await userEvent.click(screen.getByRole('button', { name: 'Move Rudi Hartono up' }))
    expect(onChange).toHaveBeenLastCalledWith(['E304', 'E305'])
    await userEvent.click(screen.getByRole('button', { name: 'Remove Anna Schmidt' }))
    expect(onChange).toHaveBeenLastCalledWith(['E304'])
  })

  it('refuses excluded people', async () => {
    render(
      <ApproverPicker
        label='Approvers'
        dataSource={instant.employee}
        excludeIds={['E301']}
      />
    )
    await userEvent.type(screen.getByRole('combobox'), 'dewi')
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })
    await userEvent.keyboard('{Enter}')
    expect(screen.getByText('Dewi Lestari cannot approve this document')).toBeInTheDocument()
  })

  it('is read-only', () => {
    render(
      <ApproverPicker
        label='Approvers'
        dataSource={instant.employee}
        defaultValue={['E301']}
        readOnly
      />
    )
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
    expect(screen.getByText('Dewi Lestari')).toBeInTheDocument()
  })
})
