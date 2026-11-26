import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Tag } from '../Tag'
import './TagInput.css'

export interface TagInputProps extends FieldProps, Omit<NativeInputProps, 'onBlur'> {
  value?: readonly string[] | null
  defaultValue?: readonly string[] | null
  onChange?: (tags: string[]) => void
  onBlur?: () => void
  /** Characters that finish a tag (Enter always does). */
  separators?: string[]
  maxTags?: number
  /** Return an error message to refuse a tag. */
  validateTag?: (tag: string) => string | undefined
  /** Case-insensitive duplicate check. */
  allowDuplicates?: boolean
}

/**
 * Free-form tokens: email recipients, keywords, serial numbers. Enter or comma adds a tag,
 * Backspace in the empty input removes the last one, pasting a list splits it.
 */
export function TagInput(props: TagInputProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = [],
    onChange,
    onBlur,
    separators = [','],
    maxTags,
    validateTag,
    allowDuplicates = false,
    placeholder,
    onKeyDown,
    name,
    ...native
  } = rest
  const [raw, setRaw] = useControllableState<readonly string[] | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const tags = raw ?? []
  const [text, setText] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editable = !field.disabled && !field.readOnly
  const full = maxTags !== undefined && tags.length >= maxTags

  const add = (candidates: string[]) => {
    let next = [...tags]
    let error: string | null = null
    for (const c of candidates.map((s) => s.trim()).filter(Boolean)) {
      if (maxTags !== undefined && next.length >= maxTags) {
        error = `At most ${String(maxTags)} items`
        break
      }
      if (!allowDuplicates && next.some((t) => t.toLowerCase() === c.toLowerCase())) continue
      const message = validateTag?.(c)
      if (message) {
        error = message
        continue
      }
      next = [...next, c]
    }
    setTagError(error)
    if (next.length !== tags.length) setRaw(next)
    return error === null
  }

  const remove = (index: number) => {
    setRaw(tags.filter((_, i) => i !== index))
    inputRef.current?.focus()
  }

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !editable) return
    if (event.key === 'Enter' || separators.includes(event.key)) {
      if (text.trim() === '') return
      event.preventDefault()
      if (add([text])) setText('')
    } else if (event.key === 'Backspace' && text === '' && tags.length > 0) {
      event.preventDefault()
      remove(tags.length - 1)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text/plain')
    const splitter = new RegExp(`[\\n\\t${separators.map((s) => s.replace(/[-\\\]^]/g, '\\$&')).join('')}]`)
    if (!splitter.test(pasted)) return
    event.preventDefault()
    add(pasted.split(splitter))
  }

  return (
    <FormField
      {...field}
      error={field.error ?? tagError}
      className={cx('erp-tag-input', field.className)}
    >
      {(f) => (
        <div
          className='erp-tag-input__box erp-input-shell'
          data-size={field.size}
          data-invalid={flag(f.invalid)}
          data-disabled={flag(field.disabled)}
          data-readonly={flag(field.readOnly)}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault()
              inputRef.current?.focus()
            }
          }}
        >
          <ul
            className='erp-tag-input__tags'
            aria-label='Selected'
          >
            {tags.map((t, i) => (
              <li key={`${t}-${String(i)}`}>
                <Tag
                  size='sm'
                  onRemove={
                    editable
                      ? () => {
                          remove(i)
                        }
                      : undefined
                  }
                >
                  {t}
                </Tag>
              </li>
            ))}
          </ul>
          <input
            ref={inputRef}
            type='text'
            className='erp-input-shell__input erp-tag-input__input'
            value={text}
            placeholder={tags.length === 0 ? placeholder : undefined}
            disabled={field.disabled || full}
            readOnly={field.readOnly}
            {...f.controlProps}
            {...native}
            onChange={(event) => {
              setText(event.target.value)
              setTagError(null)
            }}
            onKeyDown={onKey}
            onPaste={onPaste}
            onBlur={() => {
              if (text.trim() && add([text])) setText('')
              onBlur?.()
            }}
          />
          {name &&
            tags.map((t, i) => (
              <input
                key={`${t}-${String(i)}`}
                type='hidden'
                name={name}
                value={t}
              />
            ))}
        </div>
      )}
    </FormField>
  )
}
