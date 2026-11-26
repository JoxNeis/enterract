import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../LocaleProvider'
import { SignatureField, type SignatureValue } from './SignatureField'

const now = () => '2026-03-15T09:00:00Z'

const signed: SignatureValue = { mode: 'type', name: 'Dana Whitfield', dataUrl: '', signedAt: '2026-03-15T09:00:00Z' }

describe('SignatureField', () => {
  it('renders a labelled group with the statement and the method choice', () => {
    render(
      <SignatureField
        label='Received by'
        statement='I confirm the goods were received in good condition.'
        required
      />
    )
    expect(screen.getByRole('group', { name: /Received by/ })).toBeInTheDocument()
    expect(screen.getByText('I confirm the goods were received in good condition.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Draw' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('img', { name: 'Signature pad, draw with mouse, pen or finger' })).toHaveAttribute('data-empty', 'true')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('signs by typing a name and records the time of signing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LocaleProvider
        locale='en-US'
        timeZone='UTC'
      >
        <SignatureField
          label='Approved by'
          onChange={onChange}
          now={now}
        />
      </LocaleProvider>
    )
    await user.click(screen.getByRole('radio', { name: 'Type name' }))
    expect(screen.getByRole('radio', { name: 'Type name' })).toHaveAttribute('aria-checked', 'true')
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Dana Whitfield')

    expect(onChange).toHaveBeenLastCalledWith({ mode: 'type', name: 'Dana Whitfield', dataUrl: '', signedAt: '2026-03-15T09:00:00Z' })
    expect(screen.getByRole('img', { name: 'Signature of Dana Whitfield' })).toBeInTheDocument()
    // Without a canvas the typed name is shown as text instead.
    expect(screen.getByText('Dana Whitfield', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/^Signed /)).toHaveTextContent('2026')

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('')
  })

  it('clears the signature when the name is erased or the method changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SignatureField
        label='Approved by'
        defaultValue={signed}
        onChange={onChange}
        now={now}
      />
    )
    const name = screen.getByRole('textbox', { name: 'Full name' })
    expect(name).toHaveValue('Dana Whitfield')
    await user.clear(name)
    expect(onChange).toHaveBeenLastCalledWith(null)

    await user.type(name, 'D')
    await user.click(screen.getByRole('radio', { name: 'Draw' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole('textbox', { name: 'Full name' })).not.toBeInTheDocument()
  })

  it('does not record anything when there is no drawing surface', () => {
    const onChange = vi.fn()
    render(
      <SignatureField
        label='Signature'
        onChange={onChange}
        now={now}
      />
    )
    const pad = screen.getByRole('img', { name: /Signature pad/ })
    fireEvent.pointerDown(pad, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(pad, { clientX: 40, clientY: 30, pointerId: 1 })
    fireEvent.pointerUp(pad, { pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows a stored signature read-only without controls', () => {
    render(
      <SignatureField
        label='Approved by'
        value={signed}
        readOnly
        helpText='Approved on the mobile app'
      />
    )
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Signature of Dana Whitfield' })).toHaveAttribute('data-mode', 'type')
    expect(screen.getByText('Approved on the mobile app')).toBeInTheDocument()
  })

  it('shows the error message', () => {
    render(
      <SignatureField
        label='Received by'
        error='Signature is required'
      />
    )
    expect(screen.getByRole('group', { name: 'Received by' })).toHaveAttribute('data-invalid', 'true')
    expect(screen.getByText('Signature is required')).toBeInTheDocument()
  })
})
