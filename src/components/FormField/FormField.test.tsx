import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FieldMessage } from '../FieldMessage'
import { Label } from '../Label'
import { FormField } from './FormField'

describe('FormField', () => {
  it('links the label to the control', () => {
    render(<FormField label='Customer'>{(f) => <input {...f.controlProps} />}</FormField>)

    expect(screen.getByLabelText('Customer')).toBeInstanceOf(HTMLInputElement)
  })

  it('uses the given id', () => {
    render(
      <FormField
        label='Code'
        id='code'
      >
        {(f) => <input {...f.controlProps} />}
      </FormField>
    )

    expect(screen.getByLabelText('Code')).toHaveAttribute('id', 'code')
  })

  it('describes the control with error, warning and help text', () => {
    render(
      <FormField
        label='Amount'
        error='Too high'
        warning='Over budget'
        helpText='Net amount'
      >
        {(f) => <input {...f.controlProps} />}
      </FormField>
    )

    const input = screen.getByLabelText('Amount')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Too high Over budget Net amount')
  })

  it('marks required fields', () => {
    render(
      <FormField
        label='Name'
        required
      >
        {(f) => <input {...f.controlProps} />}
      </FormField>
    )

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-required', 'true')
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps a hidden label accessible', () => {
    render(
      <FormField
        label='Qty'
        hideLabel
      >
        {(f) => <input {...f.controlProps} />}
      </FormField>
    )

    expect(screen.getByLabelText('Qty')).toBeInTheDocument()
    expect(screen.getByText('Qty').closest('.erp-visually-hidden')).not.toBeNull()
  })

  it('merges className and exposes state attributes', () => {
    const { container } = render(
      <FormField
        label='X'
        className='extra'
        size='sm'
        readOnly
      >
        {(f) => <input {...f.controlProps} />}
      </FormField>
    )

    const root = container.firstElementChild
    expect(root).toHaveClass('erp-form-field', 'extra')
    expect(root).toHaveAttribute('data-size', 'sm')
    expect(root).toHaveAttribute('data-readonly', 'true')
  })

  it('renders a group label as a span for aria-labelledby', () => {
    render(
      <FormField
        label='Payment terms'
        group
      >
        {(f) => (
          <div
            role='radiogroup'
            aria-labelledby={f.labelId}
          />
        )}
      </FormField>
    )

    expect(screen.getByRole('radiogroup', { name: 'Payment terms' })).toBeInTheDocument()
  })
})

describe('Label and FieldMessage', () => {
  it('renders a label with required marker', () => {
    render(
      <Label
        htmlFor='a'
        required
      >
        Name
      </Label>
    )
    expect(screen.getByText('Name').closest('label')).toHaveAttribute('for', 'a')
  })

  it('shows an icon for error messages', () => {
    const { container } = render(<FieldMessage tone='error'>Bad</FieldMessage>)
    expect(container.querySelector('[data-icon="error"]')).not.toBeNull()
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'error')
  })
})
