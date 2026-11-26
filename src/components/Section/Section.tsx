import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import './Section.css'

export interface SectionProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: ReactNode
  description?: ReactNode
  /** Buttons on the right of the header. */
  actions?: ReactNode
  /** Header button collapses the body. */
  collapsible?: boolean
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Heading level for the document outline. */
  headingLevel?: 2 | 3 | 4 | 5
  /** Lay out the fields in a grid with this many columns. */
  columns?: number
  /** A field inside has errors: shows a marker in the header (useful when collapsed). */
  invalid?: boolean
}

/** Titled group of form fields, optionally collapsible. */
export function Section({
  title,
  description,
  actions,
  collapsible = false,
  expanded,
  defaultExpanded = true,
  onExpandedChange,
  headingLevel = 3,
  columns,
  invalid = false,
  className,
  children,
  ...props
}: SectionProps) {
  const [open, setOpen] = useControllableState({ value: expanded, defaultValue: defaultExpanded, onChange: onExpandedChange })
  const id = useId()
  const Heading = `h${String(headingLevel)}` as 'h3'
  const bodyId = `${id}-body`
  const isOpen = !collapsible || open

  const heading = (
    <>
      {collapsible && (
        <Icon
          name={open ? 'chevron-down' : 'chevron-right'}
          className='erp-section__chevron'
        />
      )}
      <span>{title}</span>
      {invalid && (
        <>
          <Icon
            name='error'
            className='erp-section__error'
          />
          <span className='erp-visually-hidden'>(has errors)</span>
        </>
      )}
    </>
  )

  return (
    <section
      className={cx('erp-section', className)}
      aria-labelledby={`${id}-title`}
      data-collapsible={flag(collapsible)}
      data-expanded={flag(isOpen)}
      {...props}
    >
      <div className='erp-section__header'>
        <div className='erp-section__heading'>
          <Heading
            id={`${id}-title`}
            className='erp-section__title'
          >
            {collapsible ? (
              <button
                type='button'
                className='erp-section__toggle'
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => {
                  setOpen(!open)
                }}
              >
                {heading}
              </button>
            ) : (
              heading
            )}
          </Heading>
          {description && <p className='erp-section__description'>{description}</p>}
        </div>
        {actions && <div className='erp-section__actions'>{actions}</div>}
      </div>
      <div
        id={bodyId}
        className='erp-section__body'
        hidden={!isOpen}
        data-columns={columns}
        style={columns ? { gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` } : undefined}
      >
        {children}
      </div>
    </section>
  )
}
