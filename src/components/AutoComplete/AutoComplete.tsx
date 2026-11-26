import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { InputShell } from '../../internal/InputShell'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { useDebouncedCallback } from '../../utils/hooks'
import type { FieldProps, Option, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import { getOptionId, Listbox, nextActiveIndex } from '../Listbox'
import { Popover } from '../Popover'
import { Spinner } from '../Spinner'
import './AutoComplete.css'

export type Suggestion = string | Option

export interface AutoCompleteProps
  extends FieldProps, ValueProps<string, ChangeEvent<HTMLInputElement> | undefined>, NativeInputProps {
  /** Static suggestions, filtered by the typed text. */
  suggestions?: readonly Suggestion[]
  /** Async suggestions. The signal aborts when the text changes again. */
  loadSuggestions?: (text: string, signal: AbortSignal) => Promise<readonly Suggestion[]>
  /** Characters typed before suggestions appear. */
  minChars?: number
  /** Delay in ms before `loadSuggestions` runs. */
  debounce?: number
  /** How static suggestions match. */
  match?: 'startsWith' | 'contains'
  /** Called when a suggestion is picked (the value is also emitted through onChange). */
  onSuggestionSelect?: (suggestion: Option) => void
  emptyText?: ReactNode
}

const toOption = (s: Suggestion): Option => (typeof s === 'string' ? { key: s, label: s } : s)

/**
 * Free-text input with suggestions (combobox with list autocomplete). The value is whatever
 * text is typed; picking a suggestion fills it in.
 */
export function AutoComplete(props: AutoCompleteProps) {
  const [field, rest] = useFieldProps(props)
  const {
    value,
    defaultValue = null,
    onChange,
    suggestions,
    loadSuggestions,
    minChars = 1,
    debounce = 200,
    match = 'contains',
    onSuggestionSelect,
    emptyText = 'No suggestions',
    onKeyDown,
    onBlur,
    ...native
  } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const shellRef = useRef<HTMLDivElement>(null)
  const listId = `${useId()}-listbox`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loaded, setLoaded] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const text = current ?? ''

  const filtered = loadSuggestions
    ? loaded
    : (suggestions ?? []).map(toOption).filter((o) => {
        const label = o.label.toLowerCase()
        const q = text.toLowerCase()
        return match === 'startsWith' ? label.startsWith(q) : label.includes(q)
      })

  const [load] = useDebouncedCallback((query: string) => {
    if (!loadSuggestions) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    loadSuggestions(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setLoaded(result.map(toOption))
        setLoading(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
  }, debounce)

  useEffect(() => () => abortRef.current?.abort(), [])

  const pick = (option: Option | undefined) => {
    if (!option) return
    setCurrent(option.label)
    onSuggestionSelect?.(option)
    setOpen(false)
    setActive(-1)
  }

  const showList = open && text.length >= minChars && (loading || filtered.length > 0 || loadSuggestions !== undefined)

  return (
    <FormField
      {...field}
      className={cx('erp-auto-complete', field.className)}
    >
      {(f) => (
        <>
          <InputShell
            ref={shellRef}
            size={field.size}
            invalid={f.invalid}
            disabled={field.disabled}
            readOnly={field.readOnly}
            suffix={loading ? <Spinner size='sm' /> : undefined}
          >
            <input
              type='text'
              role='combobox'
              autoComplete='off'
              aria-autocomplete='list'
              aria-expanded={showList}
              aria-controls={listId}
              aria-activedescendant={showList && active >= 0 ? getOptionId(listId, active) : undefined}
              className='erp-input-shell__input'
              value={text}
              disabled={field.disabled}
              readOnly={field.readOnly}
              required={field.required}
              {...f.controlProps}
              {...native}
              onChange={(event) => {
                const next = event.target.value
                setCurrent(next === '' ? null : next, event)
                setActive(-1)
                setOpen(true)
                if (next.length >= minChars) load(next)
              }}
              onBlur={(event) => {
                setOpen(false)
                onBlur?.(event)
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event)
                if (event.defaultPrevented || field.readOnly) return
                if (!showList) {
                  if (event.key === 'ArrowDown' && text.length >= minChars) {
                    event.preventDefault()
                    setOpen(true)
                    if (loadSuggestions) load(text)
                  }
                  return
                }
                const next = nextActiveIndex(filtered, active, event.key)
                if (next !== null && event.key !== 'Home' && event.key !== 'End') {
                  event.preventDefault()
                  setActive(next)
                } else if (event.key === 'Enter' && active >= 0) {
                  event.preventDefault()
                  pick(filtered[active])
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                }
              }}
            />
          </InputShell>
          <Popover
            open={showList}
            anchorRef={shellRef}
            matchAnchorWidth
            onClose={() => {
              setOpen(false)
            }}
          >
            <Listbox
              id={listId}
              options={filtered}
              activeIndex={active}
              onActiveIndexChange={setActive}
              onSelect={pick}
              loading={loading && filtered.length === 0}
              emptyText={emptyText}
              aria-labelledby={field.label != null ? f.labelId : undefined}
            />
          </Popover>
        </>
      )}
    </FormField>
  )
}
