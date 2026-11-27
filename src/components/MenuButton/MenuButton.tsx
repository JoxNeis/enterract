import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { Button, type ButtonProps } from '../Button'
import { Icon } from '../Icon'
import { typeaheadIndex } from '../Listbox'
import { Popover, type PopoverPlacement } from '../Popover'
import '../Button/Button.css'
import './MenuButton.css'

export interface MenuItem {
  key: string
  label: string
  icon?: ReactNode
  /** Shown on the right, e.g. `Ctrl+P`. */
  shortcut?: string
  disabled?: boolean
  /** Destructive item (red). */
  danger?: boolean
  /** Draw a separator above this item. */
  separatorBefore?: boolean
  onSelect?: () => void
}

export interface MenuButtonProps extends Omit<ButtonProps, 'onSelect'> {
  items: readonly MenuItem[]
  /** Called with the key of the chosen item (after the item's own onSelect). */
  onSelect?: (key: string) => void
  placement?: PopoverPlacement
  /** Hide the trailing chevron (icon-only triggers). */
  hideChevron?: boolean
}

/**
 * Button that opens a menu of actions (WAI-ARIA menu button). Enter, Space or ArrowDown opens
 * and focuses the first item; arrows move; typing jumps; Escape closes and returns focus.
 */
export function MenuButton({
  items,
  onSelect,
  placement = 'bottom-start',
  hideChevron = false,
  children,
  className,
  onKeyDown,
  onClick,
  ...props
}: MenuButtonProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const menuId = useId()
  const enabled = items.map((i, index) => ({ ...i, index })).filter((i) => !i.disabled)

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>(`[data-index="${String(active)}"]`)?.focus()
  }, [open, active])

  const openAt = (which: 'first' | 'last') => {
    const target = which === 'first' ? enabled[0] : enabled[enabled.length - 1]
    setActive(target?.index ?? 0)
    setOpen(true)
  }
  const close = (focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }
  const choose = (item: MenuItem | undefined) => {
    if (!item || item.disabled) return
    close()
    item.onSelect?.()
    onSelect?.(item.key)
  }
  const step = (dir: 1 | -1) => {
    const pos = enabled.findIndex((i) => i.index === active)
    const next = enabled[(pos + dir + enabled.length) % enabled.length]
    if (next) setActive(next.index)
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event
    if (key === 'ArrowDown') step(1)
    else if (key === 'ArrowUp') step(-1)
    else if (key === 'Home') setActive(enabled[0]?.index ?? 0)
    else if (key === 'End') setActive(enabled[enabled.length - 1]?.index ?? 0)
    else if (key === 'Enter' || key === ' ') choose(items[active])
    else if (key === 'Escape') close()
    else if (key === 'Tab') {
      close(false)
      return
    } else if (key.length === 1) {
      const match = typeaheadIndex(items, key, active)
      if (match >= 0) setActive(match)
      return
    } else return
    event.preventDefault()
  }

  return (
    <>
      <Button
        ref={triggerRef}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cx('erp-menu-button', className)}
        iconEnd={hideChevron ? undefined : <Icon name='chevron-down' />}
        {...props}
        onClick={(event) => {
          onClick?.(event)
          if (open) close()
          else openAt('first')
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openAt('first')
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openAt('last')
          }
        }}
      >
        {children}
      </Button>
      <Popover
        open={open}
        anchorRef={triggerRef}
        placement={placement}
        onClose={(reason) => {
          close(reason === 'escape')
        }}
      >
        <div
          ref={menuRef}
          id={menuId}
          role='menu'
          aria-label={typeof children === 'string' ? children : props['aria-label']}
          className='erp-menu'
          onKeyDown={onMenuKeyDown}
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
      </Popover>
    </>
  )
}
