import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/cx'
import { useFocusTrap } from '../../utils/hooks'
import { Icon } from '../Icon'
import './Dialog.css'

export interface DialogProps extends Omit<ComponentProps<'div'>, 'title' | 'role'> {
  open: boolean
  /** Called on Escape, the close button and (unless disabled) a backdrop click. */
  onClose: () => void
  title: ReactNode
  /** Short text under the title, linked with aria-describedby. */
  description?: ReactNode
  /** Buttons, right-aligned. */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** `alertdialog` for confirmations that interrupt the user. */
  role?: 'dialog' | 'alertdialog'
  closeOnBackdrop?: boolean
  hideCloseButton?: boolean
}

/**
 * Modal dialog (WAI-ARIA dialog pattern): traps Tab focus, closes on Escape, returns focus to
 * the element that opened it, and blocks page scroll while open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  role = 'dialog',
  closeOnBackdrop = true,
  hideCloseButton = false,
  className,
  children,
  ...props
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
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
      className='erp-dialog__backdrop'
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cx('erp-dialog', className)}
        data-size={size}
        {...props}
        onKeyDown={(event) => {
          props.onKeyDown?.(event)
          if (event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <div className='erp-dialog__header'>
          <h2
            id={titleId}
            className='erp-dialog__title'
          >
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              type='button'
              className='erp-input-action'
              aria-label='Close'
              onClick={onClose}
            >
              <Icon name='close' />
            </button>
          )}
        </div>
        {description && (
          <p
            id={descriptionId}
            className='erp-dialog__description'
          >
            {description}
          </p>
        )}
        {children != null && <div className='erp-dialog__body'>{children}</div>}
        {footer && <div className='erp-dialog__footer'>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
