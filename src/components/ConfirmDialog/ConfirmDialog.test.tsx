import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('confirms and cancels', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title='Post invoice?'
        message='Posted invoices cannot be edited.'
        confirmLabel='Post'
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('alertdialog', { name: 'Post invoice?' })).toHaveAccessibleDescription(
      'Posted invoices cannot be edited.'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(onConfirm).toHaveBeenCalledWith(undefined)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('requires a reason when asked', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        title='Reject?'
        tone='danger'
        requireReason
        confirmLabel='Reject'
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox', { name: /reason/i }), '  Over budget  ')
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onConfirm).toHaveBeenCalledWith('Over budget')
  })
})
