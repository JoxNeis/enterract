import { useId, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { Size } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './Tabs.css'

export interface TabItem {
  key: string
  label: ReactNode
  content: ReactNode
  /** Count or short text after the label. */
  badge?: ReactNode
  /** The panel has validation errors. Shows an error marker so errors on hidden tabs are visible. */
  invalid?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export interface TabsProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  items: readonly TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (key: string) => void
  /** `automatic`: arrows switch tabs. `manual`: arrows move focus, Enter/Space switch. */
  activation?: 'automatic' | 'manual'
  /** Keep hidden panels mounted so their form state survives switching. */
  keepMounted?: boolean
  size?: Size
  /** Accessible name of the tab list. */
  'aria-label'?: string
}

/**
 * Tabs (WAI-ARIA tabs pattern). Arrow keys move between tabs, Home/End jump. Tabs whose panel
 * has errors show a marker, so a hidden error is never missed.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  activation = 'automatic',
  keepMounted = true,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...props
}: TabsProps) {
  const firstEnabled = items.find((i) => !i.disabled)?.key ?? ''
  const [current, setCurrent] = useControllableState({ value, defaultValue: defaultValue ?? firstEnabled, onChange })
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const tabId = (key: string) => `${baseId}-tab-${key}`
  const panelId = (key: string) => `${baseId}-panel-${key}`

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled)
    const focusedKey = (document.activeElement as HTMLElement | null)?.dataset.key ?? current
    const index = enabled.findIndex((i) => i.key === focusedKey)
    let next: TabItem | undefined
    if (event.key === 'ArrowRight') next = enabled[(index + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(index - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return
    event.preventDefault()
    const target = next.key
    Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
      .find((el) => el.dataset.key === target)
      ?.focus()
    if (activation === 'automatic') setCurrent(next.key)
  }

  return (
    <div
      className={cx('erp-tabs', className)}
      data-size={size}
      {...props}
    >
      <div
        ref={listRef}
        role='tablist'
        aria-label={ariaLabel}
        className='erp-tabs__list'
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const selected = item.key === current
          return (
            <button
              key={item.key}
              type='button'
              role='tab'
              id={tabId(item.key)}
              data-key={item.key}
              aria-selected={selected}
              aria-controls={panelId(item.key)}
              aria-disabled={flag(item.disabled)}
              tabIndex={selected ? 0 : -1}
              className='erp-tabs__tab'
              data-invalid={flag(item.invalid)}
              onClick={() => {
                if (!item.disabled) setCurrent(item.key)
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.invalid && (
                <>
                  <Icon
                    name='error'
                    className='erp-tabs__error'
                  />
                  <span className='erp-visually-hidden'>(has errors)</span>
                </>
              )}
              {item.badge != null && <span className='erp-tabs__badge'>{item.badge}</span>}
            </button>
          )
        })}
      </div>
      {items.map((item) => {
        const selected = item.key === current
        if (!selected && !keepMounted) return null
        return (
          <div
            key={item.key}
            role='tabpanel'
            id={panelId(item.key)}
            aria-labelledby={tabId(item.key)}
            hidden={!selected}
            tabIndex={0}
            className='erp-tabs__panel'
          >
            {item.content}
          </div>
        )
      })}
    </div>
  )
}
