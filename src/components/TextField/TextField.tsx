import type { ChangeEvent, ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import './TextField.css'

export interface TextFieldProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement>>, NativeInputProps {
  /** Native input type. */
  type?: 'text' | 'email' | 'tel' | 'url' | 'password' | 'search'
  /** Content before the input, e.g. an icon or a unit. */
  prefix?: ReactNode
  /** Content after the input, e.g. a unit or a button. */
  suffix?: ReactNode
  /** Text alignment. */
  align?: 'start' | 'end'
  /** Class on the `<input>` element. */
  inputClassName?: string
}

/**
 * Single-line text input. Base for most text controls. Emits `null` for empty text.
 * `readOnly` keeps it focusable and selectable for posted documents.
 */
export function TextField(props: TextFieldProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    type = 'text',
    prefix,
    suffix,
    align = 'start',
    inputClassName,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })

  return (
    <FormField
      {...field}
      className={cx('erp-text-field', field.className)}
    >
      {(f) => (
        <InputShell
          size={field.size}
          invalid={f.invalid}
          disabled={field.disabled}
          readOnly={field.readOnly}
          prefix={prefix}
          suffix={suffix}
        >
          <input
            type={type}
            className={cx('erp-input-shell__input', inputClassName)}
            data-align={align}
            value={current ?? ''}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            {...f.controlProps}
            {...native}
            onChange={(event) => {
              const text = event.target.value
              setCurrent(text === '' ? null : text, event)
            }}
          />
        </InputShell>
      )}
    </FormField>
  )
}
