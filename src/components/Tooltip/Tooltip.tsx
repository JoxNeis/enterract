import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Popover, type PopoverPlacement } from '../Popover'
import './Tooltip.css'

export interface TooltipProps {
  /** Tooltip text. Keep it short; it is not shown on touch devices. */
  content: ReactNode
  /** One focusable element (button, link, input). */
  children: ReactNode
  placement?: PopoverPlacement
  /** Hover delay in ms. Keyboard focus shows it immediately. */
  delay?: number
  /** Turn off without removing the wrapper. */
  disabled?: boolean
}

/**
 * Short description of a control, shown on hover **and keyboard focus** and hidden with
 * Escape (WAI-ARIA tooltip pattern). Linked to the child with aria-describedby while shown.
 */
export function Tooltip({ content, children, placement = 'top', delay = 400, disabled = false }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = useId()
  const visible = open && !disabled

  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    []
  )

  // Describe the focusable child while the tooltip is shown.
  useEffect(() => {
    const target = anchorRef.current?.firstElementChild
    if (!visible || !target) return
    const previous = target.getAttribute('aria-describedby')
    target.setAttribute('aria-describedby', previous ? `${previous} ${id}` : id)
    return () => {
      if (previous) target.setAttribute('aria-describedby', previous)
      else target.removeAttribute('aria-describedby')
    }
  }, [visible, id])

  const show = (wait: number) => {
    if (disabled) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setOpen(true)
    }, wait)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <>
      <span
        ref={anchorRef}
        className='erp-tooltip-trigger'
        onMouseEnter={() => {
          show(delay)
        }}
        onMouseLeave={hide}
        onFocus={() => {
          show(0)
        }}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) hide()
        }}
      >
        {children}
      </span>
      <Popover
        open={visible}
        anchorRef={anchorRef}
        placement={placement}
        offset={6}
        role='tooltip'
        id={id}
        className='erp-tooltip'
        onClose={hide}
      >
        {content}
      </Popover>
    </>
  )
}
