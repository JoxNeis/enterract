import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Fab } from './Fab'

describe('Fab', () => {
  it('is a named button that does not submit forms', async () => {
    const onClick = vi.fn()
    render(
      <Fab
        icon='add'
        aria-label='New order'
        onClick={onClick}
        className='extra'
      />
    )
    const button = screen.getByRole('button', { name: 'New order' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('erp-fab', 'extra')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('shows a label when extended', () => {
    render(
      <Fab
        icon='add'
        aria-label='New order'
        label='New'
        position='static'
      />
    )
    expect(screen.getByRole('button')).toHaveAttribute('data-extended', 'true')
  })
})
