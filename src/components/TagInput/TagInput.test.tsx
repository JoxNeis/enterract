import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TagInput } from './TagInput'

describe('TagInput', () => {
  it('adds with Enter and comma, removes with Backspace', async () => {
    const onChange = vi.fn()
    render(
      <TagInput
        label='Recipients'
        onChange={onChange}
        className='extra'
      />
    )
    const input = screen.getByRole('textbox', { name: 'Recipients' })
    await userEvent.type(input, 'ap@acme.com{Enter}ar@acme.com,')
    expect(onChange).toHaveBeenLastCalledWith(['ap@acme.com', 'ar@acme.com'])
    await userEvent.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith(['ap@acme.com'])
    expect(input.closest('.erp-form-field')).toHaveClass('erp-tag-input', 'extra')
  })

  it('splits pasted lists, skips duplicates and validates', async () => {
    const onChange = vi.fn()
    render(
      <TagInput
        label='Serials'
        defaultValue={['A1']}
        validateTag={(t) => (/^[A-Z]\d+$/.test(t) ? undefined : `${t} is not a serial`)}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.paste('a1, B2\nC3,bad')
    expect(onChange).toHaveBeenLastCalledWith(['A1', 'B2', 'C3'])
    expect(screen.getByText('bad is not a serial')).toBeInTheDocument()
  })

  it('removes a tag with its button and respects maxTags', async () => {
    const onChange = vi.fn()
    render(
      <TagInput
        label='Tags'
        defaultValue={['x', 'y']}
        maxTags={2}
        onChange={onChange}
      />
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Remove x' }))
    expect(onChange).toHaveBeenLastCalledWith(['y'])
  })

  it('is read-only', () => {
    render(
      <TagInput
        label='Tags'
        defaultValue={['x']}
        readOnly
      />
    )
    expect(screen.queryByRole('button', { name: 'Remove x' })).toBeNull()
  })
})
