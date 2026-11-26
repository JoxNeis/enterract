import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps, Key, Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { getOptionId, Listbox, nextActiveIndex } from '../Listbox'
import { Popover } from '../Popover'
import './MultiSelect.css'

export interface MultiSelectProps<K extends Key = string> extends FieldProps, NativeDivProps {
  options: readonly Option<K>[]
  /** Controlled selection. `null` is treated as empty. */
  value?: readonly K[] | null
  defaultValue?: readonly K[] | null
  onChange?: (value: K[]) => void
  placeholder?: string
  /** Shows a filter box in the list. */
  searchable?: boolean
  /** Number of chips shown before "+N". */
  maxChips?: number
  /** Shows Select all / Clear actions. */
  showBulkActions?: boolean
  emptyText?: ReactNode
  autoFocus?: boolean
}

/**
 * Multiple choices from a list. The trigger shows chips; the list stays open while toggling.
 * Enter/Space toggle the active option, Escape closes.
 */
export function MultiSelect<K extends Key = string>(props: MultiSelectProps<K>) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = [],
    onChange,
    options,
    placeholder = 'Select…',
    searchable = false,
    maxChips = 3,
    showBulkActions = true,
    emptyText,
    autoFocus,
    name,
    onKeyDown,
    'aria-label': ariaLabel,
    ...native
  } = rest
  const [raw, setRaw] = useControllableState<readonly K[] | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const current = raw ?? []
  const triggerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = `${useId()}-listbox`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [query, setQuery] = useState('')
  const interactive = !field.disabled && !field.readOnly

  useEffect(() => {
    // React only auto-focuses native form elements; the trigger is a div.
    if (autoFocus) triggerRef.current?.focus()
  }, [autoFocus])

  const visible = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options
  const selectedOptions = options.filter((o) => current.includes(o.key))

  const toggle = (option: Option<K> | undefined) => {
    if (!option || option.disabled) return
    setRaw(current.includes(option.key) ? current.filter((k) => k !== option.key) : [...current, option.key])
  }
  const openList = () => {
    if (!interactive) return
    setActive(visible.findIndex((o) => !o.disabled))
    setOpen(true)
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus())
  }
  const close = () => {
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const handleListKeys = (event: KeyboardEvent<HTMLElement>) => {
    const next = nextActiveIndex(visible, active, event.key)
    if (next !== null) {
      event.preventDefault()
      setActive(next)
    } else if (event.key === 'Enter' || (event.key === ' ' && !searchable)) {
      event.preventDefault()
      toggle(visible[active])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      setOpen(false)
      setQuery('')
    } else if (event.key === 'a' && (event.ctrlKey || event.metaKey) && !searchable) {
      event.preventDefault()
      setRaw(options.filter((o) => !o.disabled).map((o) => o.key))
    }
  }

  const chips = selectedOptions.slice(0, maxChips)
  const overflow = selectedOptions.length - chips.length

  return (
    <FormField
      {...field}
      className={cx('erp-multi-select', field.className)}
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
            aria-activedescendant={open && !searchable && active >= 0 ? getOptionId(listId, active) : undefined}
            aria-labelledby={field.label != null && !ariaLabel ? f.labelId : undefined}
            aria-label={ariaLabel}
            aria-disabled={flag(field.disabled)}
            aria-readonly={flag(field.readOnly)}
            className='erp-multi-select__trigger erp-select__trigger'
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={<Icon name='chevron-down' />}
            {...f.controlProps}
            {...native}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (event.defaultPrevented || !interactive) return
              if (!open) {
                if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
                  event.preventDefault()
                  openList()
                }
                return
              }
              if (!searchable) handleListKeys(event)
            }}
            onClick={() => {
              if (open) close()
              else openList()
            }}
          >
            <span className='erp-multi-select__chips'>
              {selectedOptions.length === 0 && <span className='erp-multi-select__placeholder'>{placeholder}</span>}
              {chips.map((o) => (
                <span
                  key={String(o.key)}
                  className='erp-multi-select__chip'
                >
                  {o.label}
                </span>
              ))}
              {overflow > 0 && (
                <span className='erp-multi-select__chip erp-multi-select__more'>+{String(overflow)}</span>
              )}
            </span>
            <span className='erp-visually-hidden'>{`${String(selectedOptions.length)} selected`}</span>
          </InputShell>
          {name &&
            current.map((k) => (
              <input
                key={String(k)}
                type='hidden'
                name={name}
                value={String(k)}
              />
            ))}
          <Popover
            open={open}
            anchorRef={triggerRef}
            matchAnchorWidth
            onClose={(reason) => {
              if (reason === 'escape') close()
              else {
                setOpen(false)
                setQuery('')
              }
            }}
            className='erp-multi-select__popover'
          >
            {searchable && (
              <div className='erp-multi-select__search'>
                <Icon name='search' />
                <input
                  ref={searchRef}
                  type='text'
                  role='combobox'
                  aria-expanded
                  aria-controls={listId}
                  aria-autocomplete='list'
                  aria-activedescendant={active >= 0 ? getOptionId(listId, active) : undefined}
                  aria-label='Filter options'
                  placeholder='Filter…'
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActive(0)
                  }}
                  onKeyDown={handleListKeys}
                />
              </div>
            )}
            {showBulkActions && (
              <div className='erp-multi-select__actions'>
                <button
                  type='button'
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    const keys = new Set<K>(current)
                    visible.filter((o) => !o.disabled).forEach((o) => keys.add(o.key))
                    setRaw([...keys])
                  }}
                >
                  Select all
                </button>
                <button
                  type='button'
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    setRaw([])
                  }}
                >
                  Clear
                </button>
              </div>
            )}
            <Listbox
              id={listId}
              options={visible}
              multiple
              selected={current}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={toggle}
              emptyText={emptyText}
              aria-labelledby={field.label != null ? f.labelId : undefined}
              aria-label={ariaLabel}
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
