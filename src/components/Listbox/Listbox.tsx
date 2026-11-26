import { useEffect, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Key, Option } from '../../utils/types'
import { Icon } from '../Icon'
import { Spinner } from '../Spinner'
import { getOptionId, nextActiveIndex, typeaheadIndex } from './listNavigation'
import './Listbox.css'
import { flag } from '../../utils/flag'

export interface ListboxOptionState {
  active: boolean
  selected: boolean
}

export interface ListboxProps<K extends Key = string> extends Omit<ComponentProps<'ul'>, 'onSelect' | 'children'> {
  /** Used to build option ids for aria-activedescendant. */
  id: string
  options: readonly Option<K>[]
  /** Keys of the selected options. */
  selected?: readonly K[]
  /** Index of the highlighted option, -1 for none. */
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
  onSelect?: (option: Option<K>, index: number) => void
  /** Sets aria-multiselectable and shows checkmarks. */
  multiple?: boolean
  /** Shown when there are no options. */
  emptyText?: ReactNode
  loading?: boolean
  renderOption?: (option: Option<K>, state: ListboxOptionState) => ReactNode
  /**
   * Standalone mode: the listbox itself is focusable and handles the keys. Leave off when an
   * input keeps focus and drives the list (combobox pattern).
   */
  focusable?: boolean
}

/**
 * Keyboard-navigable option list shared by Select, ComboBox, AutoComplete, MultiSelect and
 * Lookup. In combobox use, the owner keeps focus on its input and passes `activeIndex`.
 */
export function Listbox<K extends Key = string>({
  id,
  options,
  selected = [],
  activeIndex = -1,
  onActiveIndexChange,
  onSelect,
  multiple = false,
  emptyText = 'No options',
  loading = false,
  renderOption,
  focusable = false,
  className,
  onKeyDown,
  ...props
}: ListboxProps<K>) {
  const listRef = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })

  useEffect(() => {
    if (activeIndex < 0) return
    document.getElementById(getOptionId(id, activeIndex))?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, id])

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event)
    if (!focusable || event.defaultPrevented) return
    const next = nextActiveIndex(options, activeIndex, event.key)
    if (next !== null) {
      event.preventDefault()
      onActiveIndexChange?.(next)
      return
    }
    const option = options[activeIndex]
    if ((event.key === 'Enter' || event.key === ' ') && option && !option.disabled) {
      event.preventDefault()
      onSelect?.(option, activeIndex)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = event.timeStamp
      typed.current.text = now - typed.current.at > 600 ? event.key : typed.current.text + event.key
      typed.current.at = now
      const match = typeaheadIndex(options, typed.current.text, activeIndex)
      if (match >= 0) onActiveIndexChange?.(match)
    }
  }

  const selectedSet = new Set<K>(selected)

  return (
    <ul
      ref={listRef}
      id={id}
      role='listbox'
      aria-multiselectable={flag(multiple)}
      aria-busy={flag(loading)}
      aria-activedescendant={focusable && activeIndex >= 0 ? getOptionId(id, activeIndex) : undefined}
      tabIndex={focusable ? 0 : -1}
      className={cx('erp-listbox', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {loading && (
        <li
          role='presentation'
          className='erp-listbox__status'
        >
          <Spinner size='sm' /> Loading…
        </li>
      )}
      {!loading && options.length === 0 && (
        <li
          role='presentation'
          className='erp-listbox__status'
        >
          {emptyText}
        </li>
      )}
      {options.map((option, index) => {
        const isSelected = selectedSet.has(option.key)
        const isActive = index === activeIndex
        const header =
          option.group !== undefined && option.group !== options[index - 1]?.group ? (
            <li
              role='presentation'
              className='erp-listbox__group'
            >
              {option.group}
            </li>
          ) : null
        return [
          header,
          <li
            key={String(option.key)}
            id={getOptionId(id, index)}
            role='option'
            aria-selected={isSelected}
            aria-disabled={flag(option.disabled)}
            data-active={flag(isActive)}
            className='erp-listbox__option'
            onMouseDown={(event) => {
              // Keep focus on the owner's input.
              event.preventDefault()
            }}
            onMouseMove={() => {
              if (!isActive && !option.disabled) onActiveIndexChange?.(index)
            }}
            onClick={() => {
              if (!option.disabled) onSelect?.(option, index)
            }}
          >
            {renderOption ? (
              renderOption(option, { active: isActive, selected: isSelected })
            ) : (
              <>
                {multiple && (
                  <span
                    className='erp-listbox__check'
                    data-checked={flag(isSelected)}
                    aria-hidden='true'
                  >
                    {isSelected && <Icon name='check' />}
                  </span>
                )}
                {option.icon}
                <span className='erp-listbox__text'>
                  <span className='erp-listbox__label'>{option.label}</span>
                  {option.description && <span className='erp-listbox__description'>{option.description}</span>}
                </span>
                {!multiple && isSelected && (
                  <Icon
                    name='check'
                    className='erp-listbox__selected-mark'
                  />
                )}
              </>
            )}
          </li>,
        ]
      })}
    </ul>
  )
}
