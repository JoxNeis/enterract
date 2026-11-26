import { useState, type ChangeEvent, type FocusEvent } from 'react'
import type { ParseResult } from '../utils/number'

interface Options<T> {
  value: T | null
  setValue: (value: T | null, event?: ChangeEvent<HTMLInputElement>) => void
  /** Text → value. `ok: false` keeps the text, marks it invalid and emits nothing. */
  parse: (text: string) => ParseResult<T> | { ok: false; message: string }
  /** Value shown at rest (`1,234.50`). */
  formatDisplay: (value: T) => string
  /** Value shown while editing (`1234.5`). */
  formatEdit: (value: T) => string
  onFocus?: ((event: FocusEvent<HTMLInputElement>) => void) | undefined
  onBlur?: ((event: FocusEvent<HTMLInputElement>) => void) | undefined
}

/**
 * Text state for numeric inputs: format on blur, raw on focus (contract rule 5) and no silent
 * coercion (rule 4): text that doesn't parse stays visible, is marked invalid and emits nothing.
 */
export function useParsedText<T>({ value, setValue, parse, formatDisplay, formatEdit, onFocus, onBlur }: Options<T>) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const display = focused || parseError !== null ? text : value === null ? '' : formatDisplay(value)

  const applyText = (next: string, event?: ChangeEvent<HTMLInputElement>) => {
    setText(next)
    const result = parse(next)
    if (result.ok) {
      setParseError(null)
      setValue(result.value, event)
    } else {
      setParseError('message' in result ? result.message : 'invalid')
    }
  }

  return {
    display,
    focused,
    parseError,
    /** Replace the text programmatically (stepper buttons, arrow keys). */
    setFromValue: (next: T | null) => {
      setText(next === null ? '' : formatEdit(next))
      setParseError(null)
      setValue(next)
    },
    inputProps: {
      value: display,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        applyText(event.target.value, event)
      },
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        if (parseError === null) setText(value === null ? '' : formatEdit(value))
        setFocused(true)
        onFocus?.(event)
      },
      onBlur: (event: FocusEvent<HTMLInputElement>) => {
        setFocused(false)
        onBlur?.(event)
      },
    },
  }
}
