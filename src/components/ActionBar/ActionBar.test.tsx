import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionBar } from './ActionBar'
import { matchesShortcut } from './actions'
import { must } from '../../test/must'

const all = ['new', 'save', 'saveAndClose', 'submit', 'approve', 'reject', 'post', 'release', 'cancel', 'delete', 'print'] as const

describe('ActionBar', () => {
  it('shows only actions allowed for the status', () => {
    const { rerender } = render(
      <ActionBar
        actions={all}
        context={{ status: 'draft' }}
        onAction={vi.fn()}
        className='extra'
      />
    )
    expect(screen.getByRole('toolbar')).toHaveClass('erp-action-bar', 'extra')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull()

    rerender(
      <ActionBar
        actions={all}
        context={{ status: 'pending-approval', isApprover: true }}
        onAction={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('respects permissions', () => {
    render(
      <ActionBar
        actions={all}
        context={{ status: 'draft', permissions: ['edit'] }}
        onAction={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('runs an action and its keyboard shortcut', async () => {
    const onAction = vi.fn()
    render(
      <ActionBar
        actions={['save', 'print']}
        onAction={onAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onAction).toHaveBeenCalledWith('save', {})
    await userEvent.keyboard('{Control>}s{/Control}')
    expect(onAction).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-keyshortcuts', 'Ctrl+S')
  })

  it('confirms destructive actions and asks for a reject reason', async () => {
    const onAction = vi.fn()
    render(
      <ActionBar
        actions={['approve', 'reject']}
        context={{ status: 'pending-approval', isApprover: true }}
        onAction={onAction}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Reject this document?' })
    await userEvent.click(must(screen.getAllByRole('button', { name: 'Reject' }).at(-1)))
    expect(onAction).not.toHaveBeenCalled()
    expect(dialog).toHaveTextContent('Enter a reason')
    await userEvent.type(screen.getByRole('textbox', { name: /reason/i }), 'Wrong price')
    await userEvent.click(must(screen.getAllByRole('button', { name: 'Reject' }).at(-1)))
    expect(onAction).toHaveBeenCalledWith('reject', { reason: 'Wrong price' })
  })

  it('confirms Cancel only when dirty', async () => {
    const onAction = vi.fn()
    const { rerender } = render(
      <ActionBar
        actions={['cancel']}
        onAction={onAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onAction).toHaveBeenCalledWith('cancel', {})
    rerender(
      <ActionBar
        actions={['cancel']}
        context={{ isDirty: true }}
        onAction={onAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('alertdialog', { name: 'Discard unsaved changes?' })).toBeInTheDocument()
  })

  it('puts extra actions in a More menu', async () => {
    const onAction = vi.fn()
    render(
      <ActionBar
        actions={['save', 'print', 'new']}
        maxVisible={1}
        onAction={onAction}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /print/i }))
    expect(onAction).toHaveBeenCalledWith('print', {})
  })

  it('matches shortcut strings', () => {
    const e = { key: 'S', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false }
    expect(matchesShortcut(e, 'Ctrl+Shift+S')).toBe(true)
    expect(matchesShortcut(e, 'Ctrl+S')).toBe(false)
    expect(matchesShortcut({ key: 'Escape', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, 'Esc')).toBe(true)
  })
})
