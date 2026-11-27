import { useMemo, useRef, type ChangeEvent } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { mergeRefs, useDebouncedCallback } from '../../utils/hooks'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { Spinner } from '../Spinner'
import '../../styles/base.css'
import './SearchField.css'

export interface SearchFieldProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement> | undefined>, NativeInputProps {
  /** Debounced search. Called `debounce` ms after typing stops, immediately on Enter, and with `''` on clear. */
  onSearch?: (text: string) => void
  /** Delay in ms before `onSearch` runs. */
  debounce?: number
  /** Shows a spinner while results load. */
  loading?: boolean
  /** Accessible name of the clear button. */
  clearLabel?: string
}

/** Search input with a debounced `onSearch`, a clear button and Escape to clear. */
export function SearchField(props: SearchFieldProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    onSearch,
    debounce = 300,
    loading = false,
    clearLabel = 'Clear search',
    placeholder = 'Search…',
    onKeyDown,
    ref,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [debounced, cancel] = useDebouncedCallback((text: string) => {
    onSearch?.(text)
  }, debounce)
  const inputRef = useRef<HTMLInputElement>(null)
  const mergedRef = useMemo(() => mergeRefs(inputRef, ref), [ref])
  const text = current ?? ''
  const editable = !field.disabled && !field.readOnly

  const clear = () => {
    cancel()
    setCurrent(null)
    onSearch?.('')
    inputRef.current?.focus()
  }

  return (
    <FormField
      {...field}
      className={cx('erp-search-field', field.className)}
    >
      {(f) => (
        <InputShell
          size={field.size}
          invalid={f.invalid}
          disabled={field.disabled}
          readOnly={field.readOnly}
          prefix={<Icon name='search' />}
          suffix={
            loading ? (
              <Spinner size='sm' />
            ) : text && editable ? (
              <button
                type='button'
                className='erp-input-action'
                aria-label={clearLabel}
                onClick={clear}
              >
                <Icon name='close' />
              </button>
            ) : undefined
          }
        >
          <input
            ref={mergedRef}
            type='search'
            role='searchbox'
            className='erp-input-shell__input'
            value={text}
            placeholder={placeholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            required={field.required}
            {...f.controlProps}
            {...native}
            onChange={(event) => {
              const next = event.target.value
              setCurrent(next === '' ? null : next, event)
              debounced(next)
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (event.defaultPrevented) return
              if (event.key === 'Enter') {
                event.preventDefault()
                cancel()
                onSearch?.(text)
              } else if (event.key === 'Escape' && text && editable) {
                event.preventDefault()
                clear()
              }
            }}
          />
        </InputShell>
      )}
    </FormField>
  )
}
