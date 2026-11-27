import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon, type IconName } from '../Icon'
import { htmlToText, sanitizeHtml } from './sanitize'
import '../../styles/base.css'
import './RichTextEditor.css'

export interface RichTextEditorProps extends FieldProps, NativeDivProps {
  /** Sanitized HTML. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (html: string | null) => void
  placeholder?: string
  /** Shows a character count (of the plain text). */
  maxLength?: number
  /** Editor height in rows of text. */
  rows?: number
}

interface Command {
  id: string
  label: string
  icon: IconName
  shortcut?: string
  run: () => void
  active?: () => boolean
}

/* eslint-disable @typescript-eslint/no-deprecated -- execCommand/queryCommandState have no standard replacement yet; all browsers support them */
const exec = (command: string, value?: string) => document.execCommand(command, false, value)
const isOn = (command: string) => {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}
/* eslint-enable @typescript-eslint/no-deprecated */

/**
 * Formatted text for notes, terms and conditions and email bodies: bold, italic, underline,
 * lists, headings and links. Output is sanitized HTML. A deliberately small built-in editor
 * (no third-party engine); swap in your own editor behind the same props if you need more.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, placeholder, maxLength, rows = 6, ...native } = rest
  const [html, setHtml] = useControllableState({
    value,
    defaultValue,
    onChange: onChange
      ? (v) => {
          onChange(v)
        }
      : undefined,
  })
  const editorRef = useRef<HTMLDivElement>(null)
  const [, force] = useState(0)
  const editable = !field.disabled && !field.readOnly
  const text = htmlToText(html ?? '')

  // Push external value changes into the editable element without moving the caret on own edits.
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const clean = sanitizeHtml(html ?? '')
    if (sanitizeHtml(el.innerHTML) !== clean) el.innerHTML = clean
  }, [html])

  const emit = () => {
    const el = editorRef.current
    if (!el) return
    const clean = sanitizeHtml(el.innerHTML)
    setHtml(htmlToText(clean).trim() === '' && !/<(ul|ol)/.test(clean) ? null : clean)
    force((n) => n + 1)
  }

  const run = (fn: () => void) => {
    if (!editable) return
    editorRef.current?.focus()
    fn()
    emit()
  }

  const commands: Command[] = [
    { id: 'bold', label: 'Bold', icon: 'bold', shortcut: 'Ctrl+B', run: () => exec('bold'), active: () => isOn('bold') },
    { id: 'italic', label: 'Italic', icon: 'italic', shortcut: 'Ctrl+I', run: () => exec('italic'), active: () => isOn('italic') },
    { id: 'underline', label: 'Underline', icon: 'underline', shortcut: 'Ctrl+U', run: () => exec('underline'), active: () => isOn('underline') },
    { id: 'ul', label: 'Bulleted list', icon: 'list', run: () => exec('insertUnorderedList'), active: () => isOn('insertUnorderedList') },
    { id: 'ol', label: 'Numbered list', icon: 'list-ordered', run: () => exec('insertOrderedList'), active: () => isOn('insertOrderedList') },
    { id: 'h', label: 'Heading', icon: 'heading', run: () => exec('formatBlock', 'h3') },
    {
      id: 'link',
      label: 'Link',
      icon: 'link',
      shortcut: 'Ctrl+K',
      run: () => {
        const url = window.prompt('Link address (https://…)')
        if (url && /^(https?:|mailto:)/i.test(url)) exec('createLink', url)
      },
    },
    { id: 'clear', label: 'Clear formatting', icon: 'close', run: () => exec('removeFormat') },
  ]

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return
    const map: Record<string, string> = { b: 'bold', i: 'italic', u: 'underline', k: 'link' }
    const cmd = commands.find((c) => c.id === map[event.key.toLowerCase()])
    if (cmd) {
      event.preventDefault()
      run(cmd.run)
    }
  }

  const over = maxLength !== undefined && text.length > maxLength

  return (
    <FormField
      {...field}
      group
      error={field.error ?? (over ? `Use at most ${String(maxLength)} characters` : undefined)}
      className={cx('erp-rich-text', field.className)}
      footer={
        maxLength !== undefined ? (
          <span
            className='erp-rich-text__count'
            data-over={flag(over)}
          >
            {text.length} / {maxLength}
          </span>
        ) : undefined
      }
    >
      {(f) => (
        <div
          className='erp-rich-text__box'
          data-invalid={flag(f.invalid)}
          data-disabled={flag(field.disabled)}
          data-readonly={flag(field.readOnly)}
        >
          {editable && (
            <div
              role='toolbar'
              aria-label='Formatting'
              className='erp-rich-text__toolbar'
            >
              {commands.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  className='erp-input-action'
                  aria-label={c.shortcut ? `${c.label} (${c.shortcut})` : c.label}
                  aria-pressed={c.active ? c.active() : undefined}
                  title={c.shortcut ? `${c.label} (${c.shortcut})` : c.label}
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    run(c.run)
                  }}
                >
                  <Icon name={c.icon} />
                </button>
              ))}
            </div>
          )}
          <div
            ref={editorRef}
            role='textbox'
            aria-multiline='true'
            aria-labelledby={field.label != null ? f.labelId : undefined}
            aria-describedby={f.describedBy}
            aria-invalid={flag(f.invalid)}
            aria-required={flag(field.required)}
            aria-readonly={flag(field.readOnly)}
            aria-disabled={flag(field.disabled)}
            aria-placeholder={placeholder}
            id={f.id}
            tabIndex={field.disabled ? -1 : 0}
            contentEditable={editable}
            suppressContentEditableWarning
            className='erp-rich-text__editor'
            data-empty={flag(text.trim() === '')}
            data-placeholder={placeholder}
            style={{ minHeight: `${String(rows * 1.5)}em` }}
            onInput={emit}
            onKeyDown={onKeyDown}
            onKeyUp={() => {
              force((n) => n + 1)
            }}
            onMouseUp={() => {
              force((n) => n + 1)
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text/html') || event.clipboardData.getData('text/plain')
              if (!pasted || !editable) return
              event.preventDefault()
              const isHtml = event.clipboardData.getData('text/html') !== ''
              const safe = isHtml ? sanitizeHtml(pasted) : pasted.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c).replace(/\n/g, '<br>')
              // eslint-disable-next-line @typescript-eslint/no-deprecated -- see exec()
              document.execCommand('insertHTML', false, safe)
              emit()
            }}
            {...native}
          />
        </div>
      )}
    </FormField>
  )
}
