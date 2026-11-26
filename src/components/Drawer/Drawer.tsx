import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/cx'
import { useFocusTrap } from '../../utils/hooks'
import { Icon } from '../Icon'
import './Drawer.css'

export interface DrawerProps extends Omit<ComponentProps<'div'>, 'title' | 'role'> {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Edge it slides in from. */
  side?: 'right' | 'left'
  /** Width: `sm` 24rem, `md` 36rem, `lg` 52rem, or any CSS length. */
  size?: 'sm' | 'md' | 'lg' | (string & {})
  /** Buttons at the bottom. */
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

const widths: Record<string, string> = { sm: '24rem', md: '36rem', lg: '52rem' }

/**
 * Modal panel that slides in from the edge (e.g. record details or a quick-create form).
 * Traps focus, closes on Escape and the backdrop, and returns focus when closed.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  size = 'md',
  footer,
  closeOnBackdrop = true,
  className,
  children,
  ...props
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className='erp-drawer__backdrop'
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('erp-drawer', className)}
        data-side={side}
        style={{ width: `min(${widths[size] ?? size}, 100vw)` }}
        {...props}
        onKeyDown={(event) => {
          props.onKeyDown?.(event)
          if (event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault()
            onClose()
          }
        }}
      >
        <header className='erp-drawer__header'>
          <h2
            id={titleId}
            className='erp-drawer__title'
          >
            {title}
          </h2>
          <button
            type='button'
            className='erp-input-action'
            aria-label='Close'
            onClick={onClose}
          >
            <Icon name='close' />
          </button>
        </header>
        <div className='erp-drawer__body'>{children}</div>
        {footer && <footer className='erp-drawer__footer'>{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}
