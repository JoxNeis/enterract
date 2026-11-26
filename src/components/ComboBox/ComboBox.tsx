import { useId, useRef, useState, type ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import type { FieldProps, Key, Option, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { getOptionId, Listbox, nextActiveIndex } from '../Listbox'
import { Popover } from '../Popover'
import './ComboBox.css'

export interface ComboBoxProps<K extends Key = string>
  extends FieldProps, ValueProps<K, undefined>, Omit<NativeInputProps, 'onBlur'> {
  options: readonly Option<K>[]
  /** How typed text filters the options. */
  match?: 'startsWith' | 'contains'
  /** Lets the user keep text that is not an option; `onCreate` turns it into a value. */
  onCreate?: (text: string) => K | null
  emptyText?: ReactNode
  onBlur?: () => void
}

/**
 * Select with typing: the text filters the list and the value is always an option key.
 * Leaving the field with text that matches an option label selects it; other text is reverted.
 */
export function ComboBox<K extends Key = string>(props: ComboBoxProps<K>) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    options,
    match = 'contains',
    onCreate,
    emptyText = 'No matches',
    onKeyDown,
    onBlur,
    placeholder,
    name,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const shellRef = useRef<HTMLDivElement>(null)
  const listId = `${useId()}-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const editable = !field.disabled && !field.readOnly
  const selected = options.find((o) => o.key === current)

  const q = (query ?? '').toLowerCase()
  const visible =
    query === null || q === ''
      ? options
      : options.filter((o) => (match === 'startsWith' ? o.label.toLowerCase().startsWith(q) : o.label.toLowerCase().includes(q)))

  const commit = (option: Option<K> | undefined) => {
    if (option && !option.disabled) setCurrent(option.key)
    setQuery(null)
    setOpen(false)
  }

  const resolveText = () => {
    if (query === null) return
    if (query.trim() === '') {
      setCurrent(null)
      setQuery(null)
      return
    }
    const exact = options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase())
    if (exact) commit(exact)
    else if (onCreate) {
      const created = onCreate(query.trim())
      if (created !== null) setCurrent(created)
      setQuery(null)
    } else setQuery(null)
  }

  return (
    <FormField
      {...field}
      className={cx('erp-combo-box', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={shellRef}
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={
              editable ? (
                <button
                  type='button'
                  tabIndex={-1}
                  className='erp-input-action'
                  aria-label='Show options'
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    setOpen((o) => !o)
                    setActive(options.findIndex((o) => o.key === current))
                  }}
                >
                  <Icon name='chevron-down' />
                </button>
              ) : undefined
            }
          >
            <input
              type='text'
              role='combobox'
              autoComplete='off'
              aria-autocomplete='list'
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={open && active >= 0 ? getOptionId(listId, active) : undefined}
              className='erp-input-shell__input'
              placeholder={placeholder}
              value={query ?? selected?.label ?? ''}
              disabled={field.disabled}
              readOnly={field.readOnly}
              required={field.required}
              {...f.controlProps}
              {...native}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
                setActive(0)
              }}
              onBlur={() => {
                resolveText()
                setOpen(false)
                onBlur?.()
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event)
                if (event.defaultPrevented || !editable) return
                if (!open) {
                  if (event.key === 'ArrowDown' || (event.key === 'ArrowDown' && event.altKey)) {
                    event.preventDefault()
                    setOpen(true)
                    setActive(Math.max(0, options.findIndex((o) => o.key === current)))
                  }
                  return
                }
                const next = nextActiveIndex(visible, active, event.key)
                if (next !== null && event.key !== 'Home' && event.key !== 'End') {
                  event.preventDefault()
                  setActive(next)
                } else if (event.key === 'Enter') {
                  event.preventDefault()
                  if (visible[active]) commit(visible[active])
                  else resolveText()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                  setQuery(null)
                }
              }}
            />
          </InputShell>
          {name && (
            <input
              type='hidden'
              name={name}
              value={current === null ? '' : String(current)}
            />
          )}
          <Popover
            open={open}
            anchorRef={shellRef}
            matchAnchorWidth
            onClose={() => {
              setOpen(false)
            }}
          >
            <Listbox
              id={listId}
              options={visible}
              selected={current === null ? [] : [current]}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={commit}
              emptyText={onCreate && query ? `Press Enter to add "${query}"` : emptyText}
              aria-labelledby={field.label != null ? f.labelId : undefined}
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
