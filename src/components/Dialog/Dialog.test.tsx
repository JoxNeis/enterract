import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
        }}
      >
        Open
      </button>
      <Dialog
        open={open}
        title='Edit address'
        description='Changes apply to new orders'
        className='extra'
        onClose={() => {
          onClose?.()
          setOpen(false)
        }}
        footer={<button>Save</button>}
      >
        <input aria-label='Street' />
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('opens as a labelled modal and focuses inside', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    const dialog = screen.getByRole('dialog', { name: 'Edit address' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('Changes apply to new orders')
    expect(dialog).toHaveClass('erp-dialog', 'extra')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('traps Tab and closes with Escape, returning focus', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })
})
