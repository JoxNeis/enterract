import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tag } from './Tag'

describe('Tag', () => {
  it('renders text with tone and className', () => {
    render(
      <Tag
        tone='success'
        className='extra'
      >
        Paid
      </Tag>
    )
    expect(screen.getByText('Paid').parentElement).toHaveClass('erp-tag', 'extra')
    expect(screen.getByText('Paid').parentElement).toHaveAttribute('data-tone', 'success')
  })

  it('removes with the button and with Delete', async () => {
    const onRemove = vi.fn()
    render(<Tag onRemove={onRemove}>Jakarta</Tag>)
    const button = screen.getByRole('button', { name: 'Remove Jakarta' })
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard('{Delete}')
    expect(onRemove).toHaveBeenCalledTimes(2)
  })

  it('has no remove button when disabled', () => {
    render(
      <Tag
        onRemove={vi.fn()}
        disabled
      >
        X
      </Tag>
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
})
