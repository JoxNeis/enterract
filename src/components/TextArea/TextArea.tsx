import { useLayoutEffect, useMemo, useRef, type ChangeEvent } from 'react'
import type { NativeTextAreaProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { mergeRefs } from '../../utils/hooks'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import '../../styles/base.css'
import './TextArea.css'

export interface TextAreaProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLTextAreaElement>>, NativeTextAreaProps {
  /** Grow with the content between `rows` and `maxRows`. */
  autoGrow?: boolean
  /** Upper bound for autoGrow. */
  maxRows?: number
  /** Shows `n / maxLength` (or the character count without maxLength). */
  showCount?: boolean
}

/** Multi-line text input with optional auto-grow and character counter. Emits `null` for empty text. */
export function TextArea(props: TextAreaProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    autoGrow = false,
    rows = 3,
    maxRows = 12,
    showCount = false,
    maxLength,
    ref,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const innerRef = useRef<HTMLTextAreaElement>(null)
  const mergedRef = useMemo(() => mergeRefs(innerRef, ref), [ref])
  const text = current ?? ''

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!autoGrow || !el) return
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    el.style.height = 'auto'
    const max = lineHeight * maxRows + 16
    el.style.height = `${String(Math.min(el.scrollHeight, max))}px`
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
  }, [text, autoGrow, maxRows])

  const counter = showCount ? (
    <span
      className='erp-text-area__count'
      aria-live='polite'
      data-over={flag(maxLength !== undefined && text.length >= maxLength)}
    >
      {maxLength !== undefined ? `${String(text.length)} / ${String(maxLength)}` : String(text.length)}
    </span>
  ) : undefined

  return (
    <FormField
      {...field}
      className={cx('erp-text-area', field.className)}
      footer={counter}
    >
      {(f) => (
        <textarea
          ref={mergedRef}
          className='erp-text-area__input'
          data-size={field.size}
          data-invalid={flag(f.invalid)}
          rows={rows}
          maxLength={maxLength}
          value={text}
          disabled={field.disabled}
          readOnly={field.readOnly}
          required={field.required}
          {...f.controlProps}
          {...native}
          onChange={(event) => {
            const next = event.target.value
            setCurrent(next === '' ? null : next, event)
          }}
        />
      )}
    </FormField>
  )
}
