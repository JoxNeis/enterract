import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SplitButton } from './SplitButton'

const items = [
  { key: 'saveNew', label: 'Save & New' },
  { key: 'draft', label: 'Save as draft' },
]

describe('SplitButton', () => {
  it('runs the main action and the menu actions', async () => {
    const onClick = vi.fn()
    const onSelect = vi.fn()
    render(
      <SplitButton
        onClick={onClick}
        items={items}
        onSelect={onSelect}
        className='extra'
      >
        Save
      </SplitButton>
    )
    expect(screen.getByRole('group')).toHaveClass('erp-split-button', 'extra')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'More options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save as draft' }))
    expect(onSelect).toHaveBeenCalledWith('draft')
  })

  it('disables both parts', () => {
    render(
      <SplitButton
        onClick={vi.fn()}
        items={items}
        disabled
      >
        Save
      </SplitButton>
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled()
  })
})
