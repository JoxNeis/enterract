import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { NumberField } from '../NumberField'
import { TextField } from '../TextField'
import { ToastProvider, useToast } from '../Toast'
import { Tooltip } from '../Tooltip'
import { Form } from './Form'
import { useForm } from './useForm'

interface Customer extends Record<string, unknown> {
  name: string | null
  creditLimit: number | null
}

function CustomerForm({ onSubmit, readOnly }: { onSubmit: (v: Customer) => void; readOnly?: boolean }) {
  const form = useForm<Customer>({
    initialValues: { name: 'Acme', creditLimit: null },
    required: ['name', 'creditLimit'],
    validate: (v) => (v.creditLimit !== null && v.creditLimit < 0 ? { creditLimit: 'Must be positive' } : {}),
    onSubmit,
  })
  return (
    <Form
      form={form}
      labels={{ name: 'Name', creditLimit: 'Credit limit' }}
      readOnly={readOnly}
    >
      <TextField
        label='Name'
        {...form.field('name')}
      />
      <NumberField
        label='Credit limit'
        {...form.field('creditLimit')}
      />
      <output>{form.isDirty ? 'dirty' : 'clean'}</output>
      <Button type='submit'>Save</Button>
    </Form>
  )
}

describe('Form', () => {
  it('blocks submit, shows a summary with links and focuses the first error', async () => {
    const onSubmit = vi.fn()
    render(<CustomerForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).not.toHaveBeenCalled()
    const summary = screen.getByRole('alert')
    expect(summary).toHaveTextContent('Credit limit: Required')
    await userEvent.click(screen.getByRole('link', { name: /credit limit/i }))
    expect(screen.getByRole('textbox', { name: 'Credit limit' })).toHaveFocus()
  })

  it('tracks dirty state and submits valid values', async () => {
    const onSubmit = vi.fn()
    render(<CustomerForm onSubmit={onSubmit} />)

    expect(screen.getByText('clean')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Credit limit' }), '5000')
    expect(screen.getByText('dirty')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Acme', creditLimit: 5000 }, expect.anything())
  })

  it('shows field errors after blur', async () => {
    render(<CustomerForm onSubmit={vi.fn()} />)

    const name = screen.getByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    expect(name).not.toHaveAttribute('aria-invalid')
    await userEvent.tab()
    expect(name).toHaveAttribute('aria-invalid', 'true')
  })

  it('makes every field read-only', () => {
    render(
      <CustomerForm
        onSubmit={vi.fn()}
        readOnly
      />
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('readonly')
    expect(screen.getByRole('textbox', { name: 'Credit limit' })).toHaveAttribute('readonly')
  })
})

describe('Alert', () => {
  it('uses role alert for errors and status otherwise', () => {
    render(
      <>
        <Alert
          tone='error'
          title='Failed'
        />
        <Alert tone='success'>Saved</Alert>
      </>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })

  it('can be dismissed', async () => {
    const onDismiss = vi.fn()
    render(<Alert onDismiss={onDismiss}>Note</Alert>)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })
})

function ToastButton() {
  const toast = useToast()
  return (
    <button
      onClick={() => {
        toast.success('Order saved', { duration: 1000 })
      }}
    >
      Notify
    </button>
  )
}

describe('Toast', () => {
  it('shows and auto-hides', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(
      <ToastProvider>
        <ToastButton />
      </ToastProvider>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveTextContent('Order saved')
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(screen.queryByText('Order saved')).toBeNull()
    vi.useRealTimers()
  })
})

describe('Tooltip and IconButton', () => {
  it('shows on focus, describes the control and hides with Escape', async () => {
    render(
      <Tooltip content='Prints the document'>
        <button>Print</button>
      </Tooltip>
    )

    await userEvent.tab()
    const tip = await screen.findByRole('tooltip')
    expect(tip).toHaveTextContent('Prints the document')
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Prints the document')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('icon button is named by aria-label', async () => {
    const onClick = vi.fn()
    render(
      <IconButton
        icon='trash'
        aria-label='Delete line'
        onClick={onClick}
        className='extra'
      />
    )
    const button = screen.getByRole('button', { name: 'Delete line' })
    expect(button).toHaveClass('erp-icon-button', 'extra')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })
})
