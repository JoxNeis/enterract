import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AutoComplete } from '../AutoComplete'
import { MultiSelect } from '../MultiSelect'
import { Select } from './Select'

const uoms = [
  { key: 'PCS', label: 'Pieces' },
  { key: 'BOX', label: 'Box' },
  { key: 'KG', label: 'Kilogram', disabled: true },
  { key: 'M', label: 'Meter' },
]

describe('Select', () => {
  it('opens, navigates and selects with the keyboard', async () => {
    const onChange = vi.fn()
    render(
      <Select
        label='Unit'
        options={uoms}
        onChange={onChange}
        className='extra'
      />
    )

    const combo = screen.getByRole('combobox', { name: 'Unit' })
    expect(combo.closest('.erp-form-field')).toHaveClass('extra')
    combo.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(combo).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('M', undefined)
    expect(combo).toHaveTextContent('Meter')
    expect(combo).toHaveAttribute('aria-expanded', 'false')
  })

  it('selects with a click and closes with Escape', async () => {
    render(
      <Select
        label='Unit'
        options={uoms}
      />
    )

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Box' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('Box')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('jumps by typing', async () => {
    const onChange = vi.fn()
    render(
      <Select
        label='Unit'
        options={uoms}
        onChange={onChange}
      />
    )
    screen.getByRole('combobox').focus()
    await userEvent.keyboard('m{Enter}')
    expect(onChange).toHaveBeenCalledWith('M', undefined)
  })

  it('is controlled and clearable', async () => {
    const onChange = vi.fn()
    render(
      <Select
        label='Unit'
        options={uoms}
        value='BOX'
        clearable
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onChange).toHaveBeenCalledWith(null, undefined)
    expect(screen.getByRole('combobox')).toHaveTextContent('Box')
  })

  it('does not open when readOnly or disabled', async () => {
    render(
      <>
        <Select
          label='A'
          options={uoms}
          readOnly
          defaultValue='PCS'
        />
        <Select
          label='B'
          options={uoms}
          disabled
        />
      </>
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'A' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'B' }))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('combobox', { name: 'B' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('submits through a hidden input', () => {
    const { container } = render(
      <Select
        label='Unit'
        name='uom'
        options={uoms}
        defaultValue='BOX'
      />
    )
    expect(container.querySelector('input[name="uom"]')).toHaveValue('BOX')
  })
})

describe('MultiSelect', () => {
  it('toggles options and keeps the list open', async () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label='Warehouses'
        options={uoms}
        onChange={onChange}
      />
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Warehouses' }))
    await userEvent.click(screen.getByRole('option', { name: 'Pieces' }))
    await userEvent.click(screen.getByRole('option', { name: 'Box' }))
    expect(onChange).toHaveBeenLastCalledWith(['PCS', 'BOX'])
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: 'Pieces' }))
    expect(onChange).toHaveBeenLastCalledWith(['BOX'])
  })

  it('filters when searchable and supports select all / clear', async () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label='Units'
        options={uoms}
        searchable
        onChange={onChange}
      />
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Units' }))
    await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), 'me')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(['M'])
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    await userEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onChange).toHaveBeenLastCalledWith(['M'])
  })

  it('shows chips with overflow', () => {
    render(
      <MultiSelect
        label='Units'
        options={uoms}
        defaultValue={['PCS', 'BOX', 'M']}
        maxChips={2}
      />
    )
    expect(screen.getByText('+1')).toBeInTheDocument()
  })
})

describe('AutoComplete', () => {
  it('suggests from a static list and allows free text', async () => {
    const onChange = vi.fn()
    render(
      <AutoComplete
        label='City'
        suggestions={['Jakarta', 'Bandung', 'Surabaya']}
        onChange={onChange}
      />
    )

    const input = screen.getByRole('combobox', { name: 'City' })
    await userEvent.type(input, 'ban')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('Bandung', undefined)
    await userEvent.clear(input)
    await userEvent.type(input, 'Medan')
    expect(onChange).toHaveBeenLastCalledWith('Medan', expect.anything())
  })

  it('loads suggestions asynchronously', async () => {
    const load = vi.fn((text: string) => Promise.resolve([`${text}-1`, `${text}-2`]))
    render(
      <AutoComplete
        label='Code'
        loadSuggestions={load}
        debounce={0}
      />
    )

    await userEvent.type(screen.getByRole('combobox'), 'ab')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'ab-2' })).toBeInTheDocument()
    })
  })
})
