import { useId, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './Accordion.css'

export interface AccordionItem {
  key: string
  title: ReactNode
  content: ReactNode
  /** Text on the right of the header, e.g. a count or status. */
  meta?: ReactNode
  disabled?: boolean
  /** The section has validation errors. */
  invalid?: boolean
}

export interface AccordionProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  items: readonly AccordionItem[]
  /** Keys of the open sections. */
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  onExpandedChange?: (keys: string[]) => void
  /** Several sections open at once. */
  allowMultiple?: boolean
  /** Heading level of the section titles. */
  headingLevel?: 2 | 3 | 4 | 5
}

/** Stacked collapsible sections (WAI-ARIA accordion). Up/Down/Home/End move between headers. */
export function Accordion({
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  allowMultiple = false,
  headingLevel = 3,
  className,
  ...props
}: AccordionProps) {
  const [openKeys, setOpen] = useControllableState<readonly string[]>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange ? (keys) => { onExpandedChange([...keys]) } : undefined,
  })
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const Heading = `h${String(headingLevel)}` as 'h3'

  const toggle = (key: string) => {
    const isOpen = openKeys.includes(key)
    setOpen(isOpen ? openKeys.filter((k) => k !== key) : allowMultiple ? [...openKeys, key] : [key])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const headers = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('.erp-accordion__trigger:not(:disabled)') ?? [])
    const index = headers.indexOf(document.activeElement as HTMLButtonElement)
    if (index < 0) return
    const target =
      event.key === 'ArrowDown'
        ? headers[(index + 1) % headers.length]
        : event.key === 'ArrowUp'
          ? headers[(index - 1 + headers.length) % headers.length]
          : event.key === 'Home'
            ? headers[0]
            : event.key === 'End'
              ? headers[headers.length - 1]
              : undefined
    if (!target) return
    event.preventDefault()
    target.focus()
  }

  return (
    <div
      ref={rootRef}
      className={cx('erp-accordion', className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      {items.map((item) => {
        const isOpen = openKeys.includes(item.key)
        const headerId = `${id}-${item.key}-header`
        const panelId = `${id}-${item.key}-panel`
        return (
          <div
            key={item.key}
            className='erp-accordion__item'
            data-open={flag(isOpen)}
          >
            <Heading className='erp-accordion__heading'>
              <button
                type='button'
                id={headerId}
                className='erp-accordion__trigger'
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                data-invalid={flag(item.invalid)}
                onClick={() => {
                  toggle(item.key)
                }}
              >
                <Icon
                  name={isOpen ? 'chevron-down' : 'chevron-right'}
                  className='erp-accordion__chevron'
                />
                <span className='erp-accordion__title'>{item.title}</span>
                {item.invalid && (
                  <>
                    <Icon
                      name='error'
                      className='erp-accordion__error'
                    />
                    <span className='erp-visually-hidden'>(has errors)</span>
                  </>
                )}
                {item.meta != null && <span className='erp-accordion__meta'>{item.meta}</span>}
              </button>
            </Heading>
            <div
              id={panelId}
              role='region'
              aria-labelledby={headerId}
              className='erp-accordion__panel'
              hidden={!isOpen}
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
