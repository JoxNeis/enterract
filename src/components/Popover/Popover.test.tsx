import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Popover, type PopoverCloseReason } from './Popover'

function Harness({ onClose }: { onClose?: (reason: PopoverCloseReason) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <>
      <button
        ref={ref}
        onClick={() => {
          setOpen((o) => !o)
        }}
      >
        Anchor
      </button>
      <span>Outside</span>
      <Popover
        open={open}
        anchorRef={ref}
        className='extra'
        role='dialog'
        aria-label='Panel'
        onClose={(reason) => {
          onClose?.(reason)
          setOpen(false)
        }}
      >
        Content
      </Popover>
    </>
  )
}

describe('Popover', () => {
  it('renders into document.body with the class names', () => {
    render(<Harness />)

    const dialog = screen.getByRole('dialog', { name: 'Panel' })
    expect(dialog).toHaveClass('erp-popover', 'extra')
    expect(dialog.parentElement).toBe(document.body)
  })

  it('closes on outside click but not on the anchor', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)

    await userEvent.click(screen.getByText('Outside'))
    expect(onClose).toHaveBeenCalledWith('outside')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledWith('escape')
  })

  it('renders nothing when closed', () => {
    const ref = { current: null }
    render(
      <Popover
        open={false}
        anchorRef={ref}
      >
        Hidden
      </Popover>
    )
    expect(screen.queryByText('Hidden')).toBeNull()
  })
})
