import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { MenuItem } from '../components/MenuButton'
import { typeaheadIndex } from '../components/Listbox'
import { flag } from '../utils/flag'
import '../components/MenuButton/MenuButton.css'

export interface MenuListProps {
  items: readonly MenuItem[]
  /** Called with the chosen item (after its own onSelect). */
  onSelect: (key: string) => void
  /** Escape or Tab. */
  onClose: (reason: 'escape' | 'tab') => void
  'aria-label'?: string
}

/** Keyboard-navigable `role="menu"` (internal: ContextMenu). Focuses the first item on mount. */
export function MenuList({ items, onSelect, onClose, 'aria-label': ariaLabel }: MenuListProps) {
  const enabled = items.map((item, index) => ({ item, index })).filter((e) => !e.item.disabled)
  const [active, setActive] = useState(enabled[0]?.index ?? 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(`[data-index="${String(active)}"]`)?.focus()
  }, [active])

  const choose = (item: MenuItem | undefined) => {
    if (!item || item.disabled) return
    item.onSelect?.()
    onSelect(item.key)
  }
  const step = (dir: 1 | -1) => {
    const pos = enabled.findIndex((e) => e.index === active)
    const next = enabled[(pos + dir + enabled.length) % enabled.length]
    if (next) setActive(next.index)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event
    if (key === 'ArrowDown') step(1)
    else if (key === 'ArrowUp') step(-1)
    else if (key === 'Home') setActive(enabled[0]?.index ?? 0)
    else if (key === 'End') setActive(enabled[enabled.length - 1]?.index ?? 0)
    else if (key === 'Enter' || key === ' ') choose(items[active])
    else if (key === 'Escape') onClose('escape')
    else if (key === 'Tab') {
      onClose('tab')
      return
    } else if (key.length === 1) {
      const match = typeaheadIndex(items, key, active)
      if (match >= 0) setActive(match)
      return
    } else return
    event.preventDefault()
  }

  return (
    <div
      ref={ref}
      role='menu'
      aria-label={ariaLabel}
      className='erp-menu'
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => (
        <div
          key={item.key}
          role='none'
        >
          {item.separatorBefore && (
            <div
              role='separator'
              className='erp-menu__separator'
            />
          )}
          <div
            role='menuitem'
            tabIndex={index === active ? 0 : -1}
            data-index={index}
            aria-disabled={flag(item.disabled)}
            data-danger={flag(item.danger)}
            className='erp-menu__item'
            onClick={() => {
              choose(item)
            }}
            onMouseEnter={() => {
              if (!item.disabled) setActive(index)
            }}
          >
            <span className='erp-menu__icon'>{item.icon}</span>
            <span className='erp-menu__label'>{item.label}</span>
            {item.shortcut && <kbd className='erp-menu__shortcut'>{item.shortcut}</kbd>}
          </div>
        </div>
      ))}
    </div>
  )
}
