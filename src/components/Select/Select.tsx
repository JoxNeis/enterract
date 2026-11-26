import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps, Key, Option, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { getOptionId, Listbox, nextActiveIndex, typeaheadIndex } from '../Listbox'
import { Popover } from '../Popover'
import { Spinner } from '../Spinner'
import './Select.css'

export interface SelectProps<K extends Key = string> extends FieldProps, ValueProps<K, undefined>, NativeDivProps {
  options: readonly Option<K>[]
  /** Text shown when nothing is selected. */
  placeholder?: string
  /** Shows a clear button. */
  clearable?: boolean
  /** Shown in the list when there are no options. */
  emptyText?: ReactNode
  /** Options are loading. */
  loading?: boolean
  /** Custom display of the selected option. */
  renderValue?: (option: Option<K>) => ReactNode
  /** Open the list on mount (grid editors). */
  defaultOpen?: boolean
  autoFocus?: boolean
}

/**
 * Single-select dropdown (WAI-ARIA select-only combobox). Focus stays on the trigger; arrows
 * move, Enter/Space select, typing jumps to a matching option, Escape closes.
 */
export function Select<K extends Key = string>(props: SelectProps<K>) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    options,
    placeholder = 'Select…',
    clearable = false,
    emptyText,
    loading = false,
    renderValue,
    defaultOpen = false,
    autoFocus,
    name,
    onKeyDown,
    'aria-label': ariaLabel,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const triggerRef = useRef<HTMLDivElement>(null)
  const listId = `${useId()}-listbox`
  const selectedIndex = options.findIndex((o) => o.key === current)
  const firstEnabled = options.findIndex((o) => !o.disabled)
  const [open, setOpen] = useState(defaultOpen && !field.readOnly && !field.disabled)
  const [active, setActive] = useState(selectedIndex >= 0 ? selectedIndex : firstEnabled)
  const typed = useRef({ text: '', at: 0 })
  const interactive = !field.disabled && !field.readOnly

  useEffect(() => {
    // React only auto-focuses native form elements; the trigger is a div.
    if (autoFocus) triggerRef.current?.focus()
  }, [autoFocus])
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  const openList = (index = selectedIndex >= 0 ? selectedIndex : firstEnabled) => {
    if (!interactive) return
    setActive(index)
    setOpen(true)
  }
  const choose = (option: Option<K> | undefined) => {
    if (!option || option.disabled) return
    setCurrent(option.key)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !interactive) return
    const { key } = event
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault()
        openList()
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault()
        openList(nextActiveIndex(options, -1, key) ?? -1)
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const match = typeaheadIndex(options, key, selectedIndex)
        if (match >= 0) openList(match)
      }
      return
    }
    const next = nextActiveIndex(options, active, key)
    if (next !== null) {
      event.preventDefault()
      setActive(next)
    } else if (key === 'Enter' || (key === ' ' && event.timeStamp - typed.current.at > 600)) {
      event.preventDefault()
      choose(options[active])
    } else if (key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (key === 'Tab') {
      setOpen(false)
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typed.current.text = event.timeStamp - typed.current.at > 600 ? key : typed.current.text + key
      typed.current.at = event.timeStamp
      const match = typeaheadIndex(options, typed.current.text, typed.current.text.length > 1 ? active - 1 : active)
      if (match >= 0) setActive(match)
    }
  }

  return (
    <FormField
      {...field}
      className={cx('erp-select', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={triggerRef}
            role='combobox'
            tabIndex={field.disabled ? -1 : 0}
            aria-haspopup='listbox'
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && active >= 0 ? getOptionId(listId, active) : undefined}
            aria-labelledby={field.label != null && !ariaLabel ? f.labelId : undefined}
            aria-label={ariaLabel}
            aria-disabled={flag(field.disabled)}
            aria-readonly={flag(field.readOnly)}
            className='erp-select__trigger'
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={
              <>
                {loading && <Spinner size='sm' />}
                {clearable && interactive && current !== null && (
                  <button
                    type='button'
                    tabIndex={-1}
                    className='erp-input-action'
                    aria-label='Clear selection'
                    onMouseDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      setCurrent(null)
                    }}
                  >
                    <Icon name='close' />
                  </button>
                )}
                <Icon
                  name='chevron-down'
                  className='erp-select__chevron'
                />
              </>
            }
            {...f.controlProps}
            {...native}
            onKeyDown={handleKeyDown}
            onClick={() => {
              if (open) setOpen(false)
              else openList()
            }}
          >
            <span
              className='erp-select__value'
              data-placeholder={flag(!selected)}
            >
              {selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}
            </span>
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
            anchorRef={triggerRef}
            matchAnchorWidth
            onClose={() => {
              setOpen(false)
            }}
          >
            <Listbox
              id={listId}
              options={options}
              selected={current === null ? [] : [current]}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={choose}
              emptyText={emptyText}
              loading={loading}
              aria-labelledby={field.label != null ? f.labelId : undefined}
              aria-label={ariaLabel}
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
