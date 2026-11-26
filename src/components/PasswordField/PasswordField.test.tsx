import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('hides the text and toggles visibility', async () => {
    const onChange = vi.fn()
    render(
      <PasswordField
        label='Password'
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    await userEvent.type(input, 's3cret')
    expect(onChange).toHaveBeenLastCalledWith('s3cret', expect.anything())
    const toggle = screen.getByRole('button', { name: 'Show password' })
    await userEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('has no toggle when disabled', () => {
    render(
      <PasswordField
        label='Password'
        disabled
      />
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
})
