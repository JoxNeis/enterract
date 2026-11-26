import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CascadingSelect } from './CascadingSelect'
import { addressLevels, syncAddressLevels } from './CascadingSelect.fixtures'

const choose = async (name: string, option: string) => {
  await userEvent.click(screen.getByRole('combobox', { name }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('CascadingSelect', () => {
  it('enables each level after its parent and clears children on change', async () => {
    const onChange = vi.fn()
    render(
      <CascadingSelect
        label='Address'
        levels={syncAddressLevels}
        onChange={onChange}
        className='extra'
      />
    )
    expect(screen.getByRole('group', { name: 'Address' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveAttribute('aria-disabled', 'true')
    await choose('Country', 'Indonesia')
    await choose('State', 'East Java')
    await choose('City', 'Malang')
    expect(onChange).toHaveBeenLastCalledWith(['ID', 'JI', 'MLG'])
    await choose('Country', 'Germany')
    expect(onChange).toHaveBeenLastCalledWith(['DE', null, null])
  })

  it('loads async options', async () => {
    render(
      <CascadingSelect
        label='Address'
        levels={addressLevels}
        defaultValue={['DE', 'BY', null]}
      />
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'City' }))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Munich' })).toBeInTheDocument()
    })
  })
})
