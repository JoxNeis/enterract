import { createRef, type SubmitEvent } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../Icon'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('applies the base class and merges a custom className', () => {
    render(<Button className='extra'>Save</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('erp-button', 'extra')
  })

  it('defaults to type="button" so it does not submit forms', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    render(
      <form onSubmit={onSubmit}>
        <Button>Click</Button>
      </form>
    )

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    await userEvent.click(screen.getByRole('button'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the form when type="submit" is passed', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    render(
      <form onSubmit={onSubmit}>
        <Button type='submit'>Send</Button>
      </form>
    )

    await userEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button
        disabled
        onClick={onClick}
      >
        Click
      </Button>
    )

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('forwards a ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Click</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('exposes variant and size as data attributes', () => {
    render(
      <Button
        variant='danger'
        size='sm'
      >
        Delete
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-variant', 'danger')
    expect(button).toHaveAttribute('data-size', 'sm')
  })

  it('blocks repeat clicks while loading and sets aria-busy', async () => {
    const onClick = vi.fn()
    render(
      <Button
        loading
        onClick={onClick}
      >
        Save
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a leading icon', () => {
    render(<Button icon={<Icon name='save' />}>Save</Button>)

    expect(screen.getByRole('button').querySelector('[data-icon="save"]')).not.toBeNull()
  })

  it('activates with Enter and Space', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)

    screen.getByRole('button').focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
