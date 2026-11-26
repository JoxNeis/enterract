import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TreeView } from './TreeView'
import { accountTree } from './TreeView.fixtures'

const item = (name: string | RegExp) => screen.getByRole('treeitem', { name })

describe('TreeView', () => {
  it('renders a tree with levels and positions', () => {
    render(
      <TreeView
        nodes={accountTree}
        aria-label='Accounts'
        defaultExpanded={['1']}
        className='extra'
      />
    )
    const tree = screen.getByRole('tree', { name: 'Accounts' })
    expect(tree).toHaveClass('erp-tree-view', 'extra')
    expect(item(/^Assets/)).toHaveAttribute('aria-expanded', 'true')
    expect(item(/^Current assets/)).toHaveAttribute('aria-level', '2')
    expect(item(/^Fixed assets/)).toHaveAttribute('aria-posinset', '2')
  })

  it('navigates with arrows and selects with Enter', async () => {
    const onSelectedChange = vi.fn()
    const onActivate = vi.fn()
    render(
      <TreeView
        nodes={accountTree}
        aria-label='Accounts'
        onSelectedChange={onSelectedChange}
        onActivate={onActivate}
      />
    )

    await userEvent.click(item(/^Assets/))
    await userEvent.keyboard('{ArrowRight}')
    expect(item(/^Assets/)).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(item(/^Current assets/)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['111'])
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: '111' }))
    await userEvent.keyboard('{ArrowLeft}')
    expect(item(/^Current assets/)).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(item(/^Current assets/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('checks a whole branch with tri-state checkboxes', async () => {
    const onSelectedChange = vi.fn()
    render(
      <TreeView
        nodes={accountTree}
        aria-label='Accounts'
        selectionMode='multiple'
        checkable
        defaultExpanded={['1', '11']}
        onSelectedChange={onSelectedChange}
      />
    )
    await userEvent.click(item(/^Cash/))
    expect(item(/^Current assets/)).toHaveAttribute('aria-checked', 'mixed')
    await userEvent.click(item(/^Current assets/))
    expect(item(/^Current assets/)).toHaveAttribute('aria-checked', 'true')
    expect(onSelectedChange).toHaveBeenLastCalledWith(expect.arrayContaining(['11', '111', '112', '113']))
  })

  it('loads children lazily', async () => {
    const load = vi.fn(() => Promise.resolve([{ id: '31', label: 'Share capital' }]))
    render(
      <TreeView
        nodes={accountTree}
        aria-label='Accounts'
        loadChildren={load}
      />
    )
    await userEvent.click(item(/^Equity/))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(item(/^Share capital/)).toBeInTheDocument()
    })
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('expands to matches of filterText', () => {
    render(
      <TreeView
        nodes={accountTree}
        aria-label='Accounts'
        filterText='vehic'
      />
    )
    expect(item(/^Vehicles/)).toHaveAttribute('data-match', 'true')
  })
})
