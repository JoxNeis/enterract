import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon'
import { MenuButton } from '../MenuButton'
import './Breadcrumb.css'

export interface BreadcrumbItem {
  key: string
  label: ReactNode
  href?: string
  /** For router navigation: called instead of following `href` (the default is prevented). */
  onNavigate?: () => void
}

export interface BreadcrumbProps extends ComponentProps<'nav'> {
  /** From the root to the current page. The last item is the current page. */
  items: readonly BreadcrumbItem[]
  /** Collapse middle items into a menu when there are more than this. */
  maxItems?: number
}

/** Where the user is in the module hierarchy: Sales › Orders › SO-1043. */
export function Breadcrumb({ items, maxItems = 5, className, 'aria-label': ariaLabel = 'Breadcrumb', ...props }: BreadcrumbProps) {
  const collapse = items.length > maxItems
  const head = collapse ? items.slice(0, 1) : items
  const hidden = collapse ? items.slice(1, items.length - (maxItems - 2)) : []
  const tail = collapse ? items.slice(items.length - (maxItems - 2)) : []

  const link = (item: BreadcrumbItem, current: boolean) =>
    current ? (
      <span
        aria-current='page'
        className='erp-breadcrumb__current'
      >
        {item.label}
      </span>
    ) : (
      <a
        href={item.href ?? '#'}
        className='erp-breadcrumb__link'
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (item.onNavigate) {
            event.preventDefault()
            item.onNavigate()
          }
        }}
      >
        {item.label}
      </a>
    )

  const separator = (
    <Icon
      name='chevron-right'
      className='erp-breadcrumb__sep'
    />
  )

  return (
    <nav
      aria-label={ariaLabel}
      className={cx('erp-breadcrumb', className)}
      {...props}
    >
      <ol className='erp-breadcrumb__list'>
        {head.map((item) => (
          <li key={item.key}>
            {link(item, !collapse && item === items[items.length - 1])}
            {(collapse || item !== items[items.length - 1]) && separator}
          </li>
        ))}
        {collapse && (
          <li>
            <MenuButton
              size='sm'
              variant='ghost'
              aria-label={`Show ${String(hidden.length)} more levels`}
              hideChevron
              icon={<Icon name='more' />}
              items={hidden.map((h) => ({ key: h.key, label: typeof h.label === 'string' ? h.label : h.key }))}
              onSelect={(key) => {
                const item = hidden.find((h) => h.key === key)
                if (item?.onNavigate) item.onNavigate()
                else if (item?.href) window.location.assign(item.href)
              }}
            />
            {separator}
          </li>
        )}
        {tail.map((item, i) => (
          <li key={item.key}>
            {link(item, i === tail.length - 1)}
            {i < tail.length - 1 && separator}
          </li>
        ))}
      </ol>
    </nav>
  )
}
