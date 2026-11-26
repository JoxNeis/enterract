import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FieldDefaultsProvider } from '../FormField'
import { SearchField } from '../SearchField'
import { TextArea } from '../TextArea'
import { TextField } from './TextField'

describe('TextField', () => {
  it('renders with a label and forwards className and native props', () => {
    render(
      <TextField
        label='Reference'
        className='extra'
        placeholder='PO-0001'
        maxLength={20}
        data-testid='ref'
      />
    )

    const input = screen.getByRole('textbox', { name: 'Reference' })
    expect(input).toHaveAttribute('placeholder', 'PO-0001')
    expect(input).toHaveAttribute('maxlength', '20')
    expect(input).toHaveAttribute('data-testid', 'ref')
    expect(input.closest('.erp-form-field')).toHaveClass('erp-text-field', 'extra')
  })

  it('works uncontrolled and emits null for empty text', async () => {
    const onChange = vi.fn()
    render(
      <TextField
        label='Name'
        defaultValue='Acme'
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
    await userEvent.type(input, 'B')
    expect(onChange).toHaveBeenLastCalledWith('B', expect.anything())
    expect(input).toHaveValue('B')
  })

  it('works controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('x')
      return (
        <>
          <TextField
            label='Name'
            value={value}
            onChange={setValue}
          />
          <output>{value ?? 'empty'}</output>
        </>
      )
    }
    render(<Controlled />)

    await userEvent.type(screen.getByRole('textbox'), 'y')
    expect(screen.getByText('xy')).toBeInTheDocument()
  })

  it('does not edit when readOnly but stays focusable', async () => {
    const onChange = vi.fn()
    render(
      <TextField
        label='Name'
        defaultValue='Posted'
        readOnly
        onChange={onChange}
      />
    )

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'abc')
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveFocus()
  })

  it('is disabled and takes readOnly from a FieldDefaultsProvider', () => {
    render(
      <>
        <TextField
          label='A'
          disabled
        />
        <FieldDefaultsProvider readOnly>
          <TextField label='B' />
        </FieldDefaultsProvider>
      </>
    )

    expect(screen.getByRole('textbox', { name: 'A' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'B' })).toHaveAttribute('readonly')
  })

  it('shows an error and links it', () => {
    render(
      <TextField
        label='Code'
        error='Already used'
      />
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Already used')
  })
})

describe('TextArea', () => {
  it('counts characters against maxLength', async () => {
    render(
      <TextArea
        label='Notes'
        maxLength={10}
        showCount
      />
    )

    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('emits text and null', async () => {
    const onChange = vi.fn()
    render(
      <TextArea
        label='Notes'
        onChange={onChange}
        className='extra'
      />
    )
    const box = screen.getByRole('textbox', { name: 'Notes' })
    await userEvent.type(box, 'a')
    expect(onChange).toHaveBeenLastCalledWith('a', expect.anything())
    await userEvent.clear(box)
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
    expect(box.closest('.erp-form-field')).toHaveClass('extra')
  })
})

describe('SearchField', () => {
  it('debounces onSearch and searches immediately on Enter', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onSearch = vi.fn()
    render(
      <SearchField
        aria-label='Search'
        onSearch={onSearch}
        debounce={300}
      />
    )

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    await user.type(screen.getByRole('searchbox'), 'abc')
    expect(onSearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith('abc')
    await user.type(screen.getByRole('searchbox'), 'd{Enter}')
    expect(onSearch).toHaveBeenLastCalledWith('abcd')
    vi.useRealTimers()
  })

  it('clears with the button and with Escape', async () => {
    const onSearch = vi.fn()
    render(
      <SearchField
        aria-label='Search'
        defaultValue='acme'
        onSearch={onSearch}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(onSearch).toHaveBeenLastCalledWith('')
    await userEvent.type(screen.getByRole('searchbox'), 'x{Escape}')
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})
