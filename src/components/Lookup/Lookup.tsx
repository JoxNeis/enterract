import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { useDebouncedCallback } from '../../utils/hooks'
import { toText } from '../../utils/text'
import type { FieldProps, Key, Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import { getOptionId, Listbox, nextActiveIndex } from '../Listbox'
import { Popover } from '../Popover'
import { Spinner } from '../Spinner'
import type { LookupDataSource } from './dataSource'
import '../../styles/base.css'
import './Lookup.css'
import { flag } from '../../utils/flag'

export interface LookupColumn<T> {
  /** Column id; also read from the item when `render` is omitted. */
  key: string
  header: ReactNode
  render?: (item: T) => ReactNode
  /** CSS grid track, e.g. `6rem` or `2fr`. */
  width?: string
  align?: 'start' | 'end'
}

export interface LookupProps<T, K extends Key = string> extends FieldProps, Omit<NativeInputProps, 'onBlur'> {
  /** Where results come from (server search adapter). */
  dataSource: LookupDataSource<T, K>
  value?: K | null
  defaultValue?: K | null
  /** Emits the key and the picked item (`null` when cleared). */
  onChange?: (key: K | null, item: T | null) => void
  onBlur?: () => void
  /** Result columns. Defaults to the label only. */
  columns?: LookupColumn<T>[]
  /** Text shown in the input for the selected item. Defaults to `dataSource.getLabel`. */
  displayValue?: (item: T) => string
  /** The item for the current value, if you already have it (skips `getByKey`). */
  selectedItem?: T | null
  /** Passed to every search. */
  filters?: Record<string, unknown>
  pageSize?: number
  debounce?: number
  emptyText?: ReactNode
  /** Width of the results dropdown, e.g. `32rem`. Defaults to the input width. */
  dropdownWidth?: string
}

function readField(item: unknown, key: string): ReactNode {
  return toText((item as Record<string, unknown>)[key])
}

/**
 * Searchable lookup for master data (customers, items, accounts). Server-side search with
 * paging through a LookupDataSource. Type to search; ArrowDown or F4 opens; Enter picks;
 * Escape closes and restores the previous value.
 */
export function Lookup<T, K extends Key = string>(props: LookupProps<T, K>) {
  const [field, rest] = useFieldProps(props)
  const {
    dataSource,
    value,
    defaultValue = null,
    onChange,
    onBlur,
    columns,
    displayValue,
    selectedItem: selectedItemProp,
    filters,
    pageSize = 20,
    debounce = 250,
    emptyText = 'No matches',
    dropdownWidth,
    placeholder = 'Search…',
    onKeyDown,
    name,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState<K | null, T | null>({
    value,
    defaultValue,
    onChange: onChange ? (key, item) => { onChange(key, item ?? null) } : undefined,
  })
  const shellRef = useRef<HTMLDivElement>(null)
  const listId = `${useId()}-listbox`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const [known, setKnown] = useState<T | null>(selectedItemProp ?? null)
  const abortRef = useRef<AbortController | null>(null)
  const label = (item: T) => (displayValue ? displayValue(item) : dataSource.getLabel(item))
  const editable = !field.disabled && !field.readOnly

  const selected =
    selectedItemProp !== undefined
      ? selectedItemProp
      : known && current !== null && dataSource.getKey(known) === current
        ? known
        : null

  // Resolve the label for a key we don't have the item for.
  useEffect(() => {
    if (current === null || selected || selectedItemProp !== undefined || !dataSource.getByKey) return
    const controller = new AbortController()
    dataSource
      .getByKey(current, controller.signal)
      .then((item) => {
        if (!controller.signal.aborted && item) setKnown(item)
      })
      .catch(() => undefined)
    return () => {
      controller.abort()
    }
  }, [current, selected, selectedItemProp, dataSource])

  useEffect(() => () => abortRef.current?.abort(), [])

  const runSearch = (text: string, pageIndex: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    dataSource
      .search({ search: text, page: pageIndex, pageSize, filters, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setItems((prev) => (pageIndex === 0 ? result.items : [...prev, ...result.items]))
        setPage(pageIndex)
        setTotal(result.total)
        setHasMore(result.hasMore ?? (result.total !== undefined && (pageIndex + 1) * pageSize < result.total))
        setActive((a) => (pageIndex === 0 ? (result.items.length ? 0 : -1) : a))
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoading(false)
        setError(err instanceof Error ? err.message : 'Search failed')
      })
  }
  const [debouncedSearch, cancelSearch] = useDebouncedCallback((text: string) => {
    runSearch(text, 0)
  }, debounce)

  const openList = (text = query ?? '') => {
    if (!editable) return
    setOpen(true)
    cancelSearch()
    runSearch(text, 0)
  }
  const close = () => {
    setOpen(false)
    setQuery(null)
    cancelSearch()
    abortRef.current?.abort()
    setLoading(false)
  }
  const pick = (item: T | undefined) => {
    if (!item) return
    setKnown(item)
    setCurrent(dataSource.getKey(item), item)
    close()
  }
  const loadMore = () => {
    if (hasMore && !loading) runSearch(query ?? '', page + 1)
  }

  const options: Option<K>[] = items.map((item) => ({ key: dataSource.getKey(item), label: dataSource.getLabel(item) }))
  const text =
    query ??
    (selected ? label(selected) : current !== null ? (dataSource.peekLabel?.(current) ?? String(current)) : '')
  const gridTemplate = columns?.map((c) => c.width ?? '1fr').join(' ')

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !editable) return
    if (!open) {
      if (event.key === 'F4' || (event.key === 'ArrowDown' && (event.altKey || !event.shiftKey))) {
        event.preventDefault()
        openList()
      }
      return
    }
    const next = nextActiveIndex(options, active, event.key)
    if (next !== null && event.key !== 'Home' && event.key !== 'End') {
      event.preventDefault()
      if (event.key === 'ArrowDown' && next === active) loadMore()
      setActive(next)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pick(items[active])
    } else if (event.key === 'Escape' || event.key === 'F4') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      close()
    }
  }

  return (
    <FormField
      {...field}
      error={field.error ?? error}
      className={cx('erp-lookup', field.className)}
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
              <>
                {loading && <Spinner size='sm' />}
                {editable && current !== null && query === null && (
                  <button
                    type='button'
                    tabIndex={-1}
                    className='erp-input-action'
                    aria-label='Clear'
                    onClick={() => {
                      setCurrent(null, null)
                    }}
                  >
                    <Icon name='close' />
                  </button>
                )}
                {editable && (
                  <button
                    type='button'
                    tabIndex={-1}
                    className='erp-input-action'
                    aria-label='Show results'
                    onMouseDown={(event) => {
                      event.preventDefault()
                    }}
                    onClick={() => {
                      if (open) close()
                      else openList()
                    }}
                  >
                    <Icon name='search' />
                  </button>
                )}
              </>
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
              value={text}
              placeholder={placeholder}
              disabled={field.disabled}
              readOnly={field.readOnly}
              required={field.required}
              {...f.controlProps}
              {...native}
              onChange={(event) => {
                const next = event.target.value
                setQuery(next)
                setOpen(true)
                // Drop results of the previous text so Enter can't pick a stale match.
                setItems([])
                setActive(-1)
                setLoading(true)
                debouncedSearch(next)
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (query === '' && current !== null) setCurrent(null, null)
                close()
                onBlur?.()
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
            className='erp-lookup__popover'
            style={dropdownWidth ? { width: dropdownWidth } : undefined}
            onClose={close}
          >
            {columns && (
              <div
                className='erp-lookup__header'
                style={{ gridTemplateColumns: gridTemplate }}
                aria-hidden='true'
              >
                {columns.map((c) => (
                  <span
                    key={c.key}
                    data-align={c.align}
                  >
                    {c.header}
                  </span>
                ))}
              </div>
            )}
            <Listbox
              id={listId}
              options={options}
              selected={current === null ? [] : [current]}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={(_, index) => {
                pick(items[index])
              }}
              loading={loading && items.length === 0}
              emptyText={emptyText}
              aria-labelledby={field.label != null ? f.labelId : undefined}
              onScroll={(event) => {
                const el = event.currentTarget
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) loadMore()
              }}
              renderOption={
                columns
                  ? (_, state) => {
                      const item = items[options.findIndex((o) => o.key === _.key)]
                      if (item === undefined) return null
                      return (
                        <span
                          className='erp-lookup__row'
                          data-active={flag(state.active)}
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          {columns.map((c) => (
                            <span
                              key={c.key}
                              data-align={c.align}
                            >
                              {c.render ? c.render(item) : readField(item, c.key)}
                            </span>
                          ))}
                        </span>
                      )
                    }
                  : undefined
              }
            />
            {(hasMore || total !== undefined) && (
              <div className='erp-lookup__footer'>
                <span>
                  {items.length}
                  {total !== undefined ? ` of ${String(total)}` : ''}
                </span>
                {hasMore && (
                  <button
                    type='button'
                    onMouseDown={(event) => {
                      event.preventDefault()
                    }}
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </Popover>
        </>
      )}
    </FormField>
  )
}
