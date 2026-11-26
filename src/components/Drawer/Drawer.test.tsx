import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from './Drawer'

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => {
          setOpen(true)
        }}
      >
        Details
      </button>
      <Drawer
        open={open}
        title='Customer C1008'
        side='right'
        size='sm'
        className='extra'
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        footer={<button>Save</button>}
      >
        <input aria-label='Name' />
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  it('opens as a modal dialog and closes with Escape, returning focus', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Details' }))
    const dialog = screen.getByRole('dialog', { name: 'Customer C1008' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveClass('erp-drawer', 'extra')
    expect(dialog).toHaveAttribute('data-side', 'right')
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Details' })).toHaveFocus()
  })

  it('closes with the close button', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Details' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
