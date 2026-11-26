import { useState, type ChangeEvent } from 'react'
import { useControllableState } from '../../utils/useControllableState'
import { TextField, type TextFieldProps } from '../TextField'
import { applyMask, maskPlaceholder, unmask } from './mask'

export interface MaskedFieldProps extends Omit<TextFieldProps, 'maxLength'> {
  /** Pattern: `9` digit, `A` letter, `*` letter/digit, `X` upper-cased letter/digit; other characters are literals. See `masks` for presets. */
  mask: string
  /** Emit the raw characters (`5551234567`) or the masked text (`(555) 123-4567`). */
  valueMode?: 'raw' | 'masked'
  /** Message when the field is left incomplete. */
  incompleteMessage?: string
}

/** Text input for fixed formats: phone numbers, tax IDs, IBANs, postal codes. */
export function MaskedField({
  mask,
  valueMode = 'raw',
  incompleteMessage = 'Incomplete value',
  value,
  defaultValue = null,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  ...props
}: MaskedFieldProps) {
  const [current, setCurrent] = useControllableState<string | null, ChangeEvent<HTMLInputElement>>({
    value,
    defaultValue,
    onChange,
  })
  const [touched, setTouched] = useState(false)
  const display = current ? applyMask(valueMode === 'raw' ? current : unmask(current, mask), mask) : null
  const incomplete = display !== null && !display.complete

  return (
    <TextField
      {...props}
      value={display?.masked ?? null}
      placeholder={placeholder ?? maskPlaceholder(mask)}
      inputMode={/^[9\W]*$/.test(mask) ? 'numeric' : undefined}
      maxLength={mask.length}
      error={error ?? (touched && incomplete ? incompleteMessage : undefined)}
      onFocus={(event) => {
        setTouched(false)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setTouched(true)
        onBlur?.(event)
      }}
      onChange={(text, event) => {
        const result = applyMask(unmask(text ?? '', mask), mask)
        const next = result.raw === '' ? null : valueMode === 'raw' ? result.raw : result.masked
        setCurrent(next, event)
      }}
    />
  )
}
