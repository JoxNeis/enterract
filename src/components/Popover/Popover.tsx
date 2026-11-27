import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentProps, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils/cx'
import { mergeRefs, useOutsidePointerDown, useStableCallback } from '../../utils/hooks'
import '../../styles/base.css'
import './Popover.css'

export type PopoverPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'top'
  | 'right-start'
  | 'left-start'

export type PopoverCloseReason = 'outside' | 'escape'

export interface PopoverProps extends ComponentProps<'div'> {
  /** Shown when true. Nothing is rendered when false. */
  open: boolean
  /** Element the popover is positioned against. Clicks on it don't count as outside clicks. */
  anchorRef: RefObject<HTMLElement | null>
  /** Called on outside click or Escape. */
  onClose?: (reason: PopoverCloseReason) => void
  /** Preferred placement. Flips to the other side when there isn't room. */
  placement?: PopoverPlacement
  /** Gap to the anchor in px. */
  offset?: number
  /** Makes the popover at least as wide as the anchor (dropdowns). */
  matchAnchorWidth?: boolean
  /** Render into document.body (default) so overflow:hidden parents and grids don't clip it. */
  portal?: boolean
}

function position(anchor: HTMLElement, el: HTMLElement, placement: PopoverPlacement, offset: number, matchWidth: boolean) {
  const a = anchor.getBoundingClientRect()
  if (matchWidth) el.style.minWidth = `${String(a.width)}px`
  const p = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const [side, align = 'center'] = placement.split('-') as [string, string | undefined]
  let top: number
  let left: number

  if (side === 'bottom' || side === 'top') {
    const below = a.bottom + offset
    const above = a.top - p.height - offset
    top = side === 'bottom' ? (below + p.height > vh && above >= 0 ? above : below) : above < 0 && below + p.height <= vh ? below : above
    left = align === 'start' ? a.left : align === 'end' ? a.right - p.width : a.left + (a.width - p.width) / 2
  } else {
    const right = a.right + offset
    const leftSide = a.left - p.width - offset
    left = side === 'right' ? (right + p.width > vw && leftSide >= 0 ? leftSide : right) : leftSide < 0 ? right : leftSide
    top = a.top
  }

  left = Math.max(4, Math.min(left, vw - p.width - 4))
  top = Math.max(4, Math.min(top, vh - p.height - 4))
  el.style.top = `${String(top)}px`
  el.style.left = `${String(left)}px`
}

/**
 * Positioned overlay anchored to an element. Used by Select, DatePicker, Lookup, Tooltip and
 * menus. It handles placement, outside clicks and Escape; focus management stays with the owner.
 */
export function Popover({
  open,
  anchorRef,
  onClose,
  placement = 'bottom-start',
  offset = 4,
  matchAnchorWidth = false,
  portal = true,
  className,
  children,
  onKeyDown,
  ref,
  ...props
}: PopoverProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMemo(() => mergeRefs(innerRef, ref), [ref])
  const close = useStableCallback((reason: PopoverCloseReason) => {
    onClose?.(reason)
  })

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const el = innerRef.current
    if (!open || !anchor || !el) return
    const update = () => {
      position(anchor, el, placement, offset, matchAnchorWidth)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef, placement, offset, matchAnchorWidth])

  const refs = useMemo(() => [innerRef, anchorRef] as const, [anchorRef])
  useOutsidePointerDown(
    refs,
    () => {
      close('outside')
    },
    open
  )

  useEffect(() => {
    if (!open) return
    const onDocKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close('escape')
    }
    document.addEventListener('keydown', onDocKey)
    return () => {
      document.removeEventListener('keydown', onDocKey)
    }
  }, [open, close])

  if (!open) return null

  const content = (
    <div
      ref={mergedRef}
      className={cx('erp-popover', 'erp-surface', className)}
      data-placement={placement}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === 'Escape' && !event.defaultPrevented) {
          // Consume Escape so a host (e.g. a grid editor) doesn't also cancel.
          event.preventDefault()
          close('escape')
        }
      }}
      {...props}
    >
      {children}
    </div>
  )

  return portal ? createPortal(content, document.body) : content
}
