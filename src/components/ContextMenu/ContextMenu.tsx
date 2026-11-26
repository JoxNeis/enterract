import { useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useOutsidePointerDown } from '../../utils/hooks'
import { MenuList } from '../../internal/MenuList'
import type { MenuItem } from '../MenuButton'
import './ContextMenu.css'

export interface ContextMenuProps {
  /** Items, or a function that builds them for the clicked target. */
  items: readonly MenuItem[] | ((target: HTMLElement) => readonly MenuItem[])
  onSelect?: (key: string, target: HTMLElement) => void
  /** The area that has the menu. */
  children: ReactNode
  disabled?: boolean
  'aria-label'?: string
}

interface OpenState {
  x: number
  y: number
  target: HTMLElement
  returnFocus: HTMLElement | null
}

/**
 * Right-click menu for an area (grid rows, tree nodes). Opens with the right mouse button,
 * Shift+F10 or the Menu key; arrows move, Enter picks, Escape closes and returns focus.
 */
export function ContextMenu({ items, onSelect, children, disabled = false, 'aria-label': ariaLabel = 'Actions' }: ContextMenuProps) {
  const [open, setOpen] = useState<OpenState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const refs = useMemo(() => [menuRef], [])

  const close = (focus = true) => {
    if (focus) open?.returnFocus?.focus()
    setOpen(null)
  }
  useOutsidePointerDown(refs, () => {
    close(false)
  }, open !== null)

  const show = (x: number, y: number, target: HTMLElement) => {
    if (disabled) return
    const width = 200
    setOpen({
      x: Math.min(x, window.innerWidth - width - 8),
      y: Math.min(y, window.innerHeight - 40),
      target,
      returnFocus: document.activeElement as HTMLElement | null,
    })
  }

  const list = open ? (typeof items === 'function' ? items(open.target) : items) : []

  return (
    <>
      <div
        className='erp-context-menu-area'
        onContextMenu={(event) => {
          if (disabled) return
          event.preventDefault()
          show(event.clientX, event.clientY, event.target as HTMLElement)
        }}
        onKeyDown={(event) => {
          if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
            event.preventDefault()
            const el = event.target as HTMLElement
            const rect = el.getBoundingClientRect()
            show(rect.left + 8, rect.bottom, el)
          }
        }}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className='erp-context-menu erp-surface'
            style={{ left: open.x, top: open.y }}
          >
            <MenuList
              items={list}
              aria-label={ariaLabel}
              onClose={(reason) => {
                close(reason === 'escape')
              }}
              onSelect={(key) => {
                const { target } = open
                close()
                onSelect?.(key, target)
              }}
            />
          </div>,
          document.body
        )}
    </>
  )
}
