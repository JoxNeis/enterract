import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RichTextEditor } from './RichTextEditor'
import { htmlToText, sanitizeHtml } from './sanitize'

describe('sanitizeHtml', () => {
  it('keeps basic formatting and drops scripts, styles, handlers and unsafe links', () => {
    const dirty =
      '<div onclick="x()">Hi <b>there</b> <i>you</i></div><script>alert(1)</script><style>p{}</style>' +
      '<a href="javascript:alert(1)">bad</a><a href="https://erp.example/so/1043" style="color:red">good</a>' +
      '<span class="x">plain</span><table><tr><td>cell</td></tr></table>'
    expect(sanitizeHtml(dirty)).toBe(
      '<p>Hi <strong>there</strong> <em>you</em></p><a>bad</a>' +
        '<a href="https://erp.example/so/1043" rel="noopener noreferrer" target="_blank">good</a>plaincell'
    )
  })

  it('keeps lists and headings', () => {
    expect(sanitizeHtml('<h3>Terms</h3><ul><li>Net 30</li></ul><ol><li>One</li></ol>')).toBe('<h3>Terms</h3><ul><li>Net 30</li></ul><ol><li>One</li></ol>')
  })

  it('htmlToText returns the plain text', () => {
    expect(htmlToText('<p>Net <strong>30</strong></p>')).toBe('Net 30')
  })
})

describe('RichTextEditor', () => {
  const exec = vi.fn<(command: string, showUI?: boolean, value?: string) => boolean>(() => true)

  beforeEach(() => {
    Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: exec })
    Object.defineProperty(document, 'queryCommandState', { configurable: true, writable: true, value: () => false })
  })

  afterEach(() => {
    exec.mockClear()
  })

  it('renders a labelled multi-line textbox with the sanitized value', () => {
    render(
      <RichTextEditor
        label='Terms and conditions'
        defaultValue='<p>Net <b>30</b></p><script>alert(1)</script>'
        required
      />
    )
    const box = screen.getByRole('textbox', { name: /Terms and conditions/ })
    expect(box).toHaveAttribute('aria-multiline', 'true')
    expect(box).toHaveAttribute('aria-required', 'true')
    expect(box).toHaveAttribute('contenteditable', 'true')
    expect(box.innerHTML).toBe('<p>Net <strong>30</strong></p>')
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
  })

  it('emits sanitized HTML on input and null when emptied', () => {
    const onChange = vi.fn()
    render(
      <RichTextEditor
        label='Notes'
        onChange={onChange}
      />
    )
    const box = screen.getByRole('textbox', { name: 'Notes' })
    box.innerHTML = 'Deliver to <b onclick="x()">dock 3</b>'
    fireEvent.input(box)
    expect(onChange).toHaveBeenLastCalledWith('Deliver to <strong>dock 3</strong>')

    box.innerHTML = '<br>'
    fireEvent.input(box)
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('updates the content when the controlled value changes', () => {
    const { rerender } = render(
      <RichTextEditor
        label='Notes'
        value='<p>First</p>'
      />
    )
    const box = screen.getByRole('textbox', { name: 'Notes' })
    expect(box.innerHTML).toBe('<p>First</p>')
    rerender(
      <RichTextEditor
        label='Notes'
        value='<p>Second <img src=x onerror=alert(1)></p>'
      />
    )
    expect(box.innerHTML).toBe('<p>Second </p>')
  })

  it('runs formatting commands from the toolbar and keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(<RichTextEditor label='Notes' />)
    await user.click(screen.getByRole('button', { name: 'Bold (Ctrl+B)' }))
    expect(exec).toHaveBeenCalledWith('bold', false, undefined)
    await user.click(screen.getByRole('button', { name: 'Numbered list' }))
    expect(exec).toHaveBeenCalledWith('insertOrderedList', false, undefined)
    await user.click(screen.getByRole('button', { name: 'Heading' }))
    expect(exec).toHaveBeenCalledWith('formatBlock', false, 'h3')

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), { key: 'i', ctrlKey: true })
    expect(exec).toHaveBeenCalledWith('italic', false, undefined)
  })

  it('only creates links with a safe address', async () => {
    const user = userEvent.setup()
    const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('javascript:alert(1)').mockReturnValueOnce('https://erp.example')
    render(<RichTextEditor label='Notes' />)
    const link = screen.getByRole('button', { name: 'Link (Ctrl+K)' })
    await user.click(link)
    expect(exec).not.toHaveBeenCalledWith('createLink', false, expect.anything())
    await user.click(link)
    expect(exec).toHaveBeenCalledWith('createLink', false, 'https://erp.example')
    expect(prompt).toHaveBeenCalledTimes(2)
  })

  it('pastes plain text escaped and HTML sanitized', () => {
    render(<RichTextEditor label='Notes' />)
    const box = screen.getByRole('textbox', { name: 'Notes' })
    const data = (types: Record<string, string>) => ({ clipboardData: { getData: (t: string) => types[t] ?? '' } })

    fireEvent.paste(box, data({ 'text/plain': 'a < b\nnext' }))
    expect(exec).toHaveBeenLastCalledWith('insertHTML', false, 'a &lt; b<br>next')

    fireEvent.paste(box, data({ 'text/html': '<b>Bold</b><script>x</script>', 'text/plain': 'Bold' }))
    expect(exec).toHaveBeenLastCalledWith('insertHTML', false, '<strong>Bold</strong>')
  })

  it('counts characters and flags text over maxLength', () => {
    render(
      <RichTextEditor
        label='Remark'
        defaultValue='<p>Twelve chars</p>'
        maxLength={10}
      />
    )
    expect(screen.getByText('12 / 10')).toHaveAttribute('data-over', 'true')
    expect(screen.getByText('Use at most 10 characters')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Remark' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('is not editable when read-only or disabled', () => {
    const { rerender } = render(
      <RichTextEditor
        label='Notes'
        defaultValue='<p>Locked</p>'
        readOnly
      />
    )
    let box = screen.getByRole('textbox', { name: 'Notes' })
    expect(box).toHaveAttribute('contenteditable', 'false')
    expect(box).toHaveAttribute('aria-readonly', 'true')
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()

    rerender(
      <RichTextEditor
        label='Notes'
        defaultValue='<p>Locked</p>'
        disabled
      />
    )
    box = screen.getByRole('textbox', { name: 'Notes' })
    expect(box).toHaveAttribute('aria-disabled', 'true')
    expect(box).toHaveAttribute('tabindex', '-1')
  })
})
