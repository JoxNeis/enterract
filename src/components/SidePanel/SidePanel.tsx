import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './SidePanel.css'

export interface SidePanelProps extends Omit<ComponentProps<'aside'>, 'title'> {
  title: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Width when open (CSS length). */
  width?: string
  /** Which edge of the layout it sits on; sets the collapse arrow direction. */
  side?: 'right' | 'left'
  /** Buttons in the header. */
  actions?: ReactNode
}

/**
 * Docked, non-modal panel beside the main content (details, comments, filters). The page stays
 * usable. Collapses to a thin strip with a toggle button.
 */
export function SidePanel({
  title,
  open,
  defaultOpen = true,
  onOpenChange,
  width = '20rem',
  side = 'right',
  actions,
  className,
  children,
  ...props
}: SidePanelProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const id = useId()
  const pointsOut = (side === 'right') === isOpen

  return (
    <aside
      className={cx('erp-side-panel', className)}
      data-side={side}
      data-open={flag(isOpen)}
      aria-labelledby={`${id}-title`}
      style={{ width: isOpen ? width : undefined }}
      {...props}
    >
      <header className='erp-side-panel__header'>
        <button
          type='button'
          className='erp-input-action'
          aria-expanded={isOpen}
          aria-controls={`${id}-body`}
          aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
          onClick={() => {
            setOpen(!isOpen)
          }}
        >
          <Icon name={pointsOut ? 'chevron-right' : 'chevron-left'} />
        </button>
        <h2
          id={`${id}-title`}
          className='erp-side-panel__title'
        >
          {title}
        </h2>
        {isOpen && actions && <div className='erp-side-panel__actions'>{actions}</div>}
      </header>
      <div
        id={`${id}-body`}
        className='erp-side-panel__body'
        hidden={!isOpen}
      >
        {children}
      </div>
    </aside>
  )
}
