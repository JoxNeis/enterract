import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Option } from '../../utils/types'
import { Listbox } from './Listbox'
import { nextActiveIndex, typeaheadIndex } from './listNavigation'

const options: Option[] = [
  { key: 'usd', label: 'US Dollar', group: 'Americas' },
  { key: 'cad', label: 'Canadian Dollar', group: 'Americas', disabled: true },
  { key: 'eur', label: 'Euro', group: 'Europe' },
  { key: 'gbp', label: 'Pound Sterling', group: 'Europe' },
]

function Standalone({ onSelect }: { onSelect: (key: string) => void }) {
  const [active, setActive] = useState(0)
  return (
    <Listbox
      id='cur'
      aria-label='Currency'
      options={options}
      focusable
      activeIndex={active}
      onActiveIndexChange={setActive}
      onSelect={(o) => {
        onSelect(o.key)
      }}
    />
  )
}

describe('nextActiveIndex', () => {
  it('skips disabled items and clamps', () => {
    expect(nextActiveIndex(options, 0, 'ArrowDown')).toBe(2)
    expect(nextActiveIndex(options, 2, 'ArrowUp')).toBe(0)
    expect(nextActiveIndex(options, 3, 'ArrowDown')).toBe(3)
    expect(nextActiveIndex(options, -1, 'End')).toBe(3)
    expect(nextActiveIndex(options, 0, 'x')).toBeNull()
  })

  it('finds typeahead matches', () => {
    expect(typeaheadIndex(options, 'p', 0)).toBe(3)
    expect(typeaheadIndex(options, 'c', 0)).toBe(-1)
  })
})

describe('Listbox', () => {
  it('renders options, groups and selection', () => {
    render(
      <Listbox
        id='l'
        aria-label='Currency'
        options={options}
        selected={['eur']}
      />
    )

    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(screen.getByRole('option', { name: 'Euro' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Canadian Dollar' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Europe')).toBeInTheDocument()
  })

  it('selects with click but not disabled options', async () => {
    const onSelect = vi.fn()
    render(
      <Listbox
        id='l'
        aria-label='Currency'
        options={options}
        onSelect={onSelect}
      />
    )

    await userEvent.click(screen.getByRole('option', { name: 'Canadian Dollar' }))
    expect(onSelect).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('option', { name: 'Euro' }))
    expect(onSelect).toHaveBeenCalledWith(options[2], 2)
  })

  it('handles the keyboard in standalone mode', async () => {
    const onSelect = vi.fn()
    render(<Standalone onSelect={onSelect} />)

    screen.getByRole('listbox').focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('eur')
    await userEvent.keyboard('p{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('gbp')
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', 'cur-option-3')
  })

  it('shows empty and loading states', () => {
    const { rerender } = render(
      <Listbox
        id='l'
        options={[]}
        emptyText='Nothing found'
      />
    )
    expect(screen.getByText('Nothing found')).toBeInTheDocument()
    rerender(
      <Listbox
        id='l'
        options={[]}
        loading
      />
    )
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true')
  })
})
