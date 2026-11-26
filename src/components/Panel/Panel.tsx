import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import './Panel.css'

export interface PanelProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: ReactNode
  /** Buttons in the header. */
  actions?: ReactNode
  /** Content at the bottom, e.g. totals or buttons. */
  footer?: ReactNode
  collapsible?: boolean
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** `outlined` (border) or `filled` (subtle background). */
  variant?: 'outlined' | 'filled'
  /** Remove body padding (e.g. for a grid inside). */
  flush?: boolean
}

/** Bordered box with an optional header, collapsible body and footer. */
export function Panel({
  title,
  actions,
  footer,
  collapsible = false,
  expanded,
  defaultExpanded = true,
  onExpandedChange,
  variant = 'outlined',
  flush = false,
  className,
  children,
  ...props
}: PanelProps) {
  const [open, setOpen] = useControllableState({ value: expanded, defaultValue: defaultExpanded, onChange: onExpandedChange })
  const id = useId()
  const isOpen = !collapsible || open
  const hasHeader = title != null || actions != null

  return (
    <section
      className={cx('erp-panel', className)}
      data-variant={variant}
      data-flush={flag(flush)}
      aria-labelledby={title != null ? `${id}-title` : undefined}
      {...props}
    >
      {hasHeader && (
        <header className='erp-panel__header'>
          {title != null && (
            <h3
              id={`${id}-title`}
              className='erp-panel__title'
            >
              {collapsible ? (
                <button
                  type='button'
                  className='erp-panel__toggle'
                  aria-expanded={open}
                  aria-controls={`${id}-body`}
                  onClick={() => {
                    setOpen(!open)
                  }}
                >
                  <Icon name={open ? 'chevron-down' : 'chevron-right'} />
                  {title}
                </button>
              ) : (
                title
              )}
            </h3>
          )}
          {actions && <div className='erp-panel__actions'>{actions}</div>}
        </header>
      )}
      <div
        id={`${id}-body`}
        className='erp-panel__body'
        hidden={!isOpen}
      >
        {children}
      </div>
      {footer && isOpen && <footer className='erp-panel__footer'>{footer}</footer>}
    </section>
  )
}
