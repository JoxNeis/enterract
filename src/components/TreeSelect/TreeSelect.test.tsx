import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { accountTree } from '../TreeView/TreeView.fixtures'
import { TreeSelect } from './TreeSelect'

describe('TreeSelect', () => {
  it('picks one node and closes', async () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        label='Account'
        nodes={accountTree}
        defaultExpanded={['1', '11']}
        onChange={onChange}
        className='extra'
      />
    )
    const trigger = screen.getByRole('button', { name: /account/i })
    expect(trigger.closest('.erp-form-field')).toHaveClass('erp-tree-select', 'extra')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('treeitem', { name: /^Bank accounts/ }))
    expect(onChange).toHaveBeenCalledWith('112', undefined)
    expect(screen.queryByRole('tree')).toBeNull()
    expect(trigger).toHaveTextContent('Bank accounts')
  })

  it('filters with the search box', async () => {
    render(
      <TreeSelect
        label='Account'
        nodes={accountTree}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /account/i }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'vehic')
    expect(screen.getByRole('treeitem', { name: /^Vehicles/ })).toHaveAttribute('data-match', 'true')
  })

  it('checks several nodes in multiple mode', async () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        label='Accounts'
        multiple
        nodes={accountTree}
        defaultExpanded={['1', '12']}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /accounts/i }))
    await userEvent.click(screen.getByRole('treeitem', { name: /^Fixed assets/ }))
    expect(onChange).toHaveBeenLastCalledWith(['12', '121', '122'], undefined)
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /accounts/i })).toHaveTextContent('Machinery, Vehicles')
  })

  it('can forbid parent nodes', async () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        label='Account'
        nodes={accountTree}
        selectableParents={false}
        defaultExpanded={['1']}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /account/i }))
    await userEvent.click(screen.getByRole('treeitem', { name: /^Current assets/ }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
