import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Alert } from '../Alert'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { MenuButton, type MenuItem } from '../MenuButton'
import { Spinner } from '../Spinner'
import '../../styles/base.css'
import './Widget.css'

export interface WidgetProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: ReactNode
  subtitle?: ReactNode
  /** Header menu (Refresh, Export, Remove from dashboard…). */
  menuItems?: readonly MenuItem[]
  onMenuSelect?: (key: string) => void
  /** Shows a spinner over the content. */
  loading?: boolean
  /** Error text with a Retry button (needs `onRetry`). */
  error?: ReactNode
  onRetry?: () => void
  /** Small text at the bottom, e.g. "Updated 09:30". */
  footer?: ReactNode
}

/** Dashboard tile frame: header with menu, loading and error states, footer. */
export function Widget({
  title,
  subtitle,
  menuItems,
  onMenuSelect,
  loading = false,
  error,
  onRetry,
  footer,
  className,
  children,
  ...props
}: WidgetProps) {
  const id = useId()
  return (
    <section
      className={cx('erp-widget', className)}
      aria-labelledby={`${id}-title`}
      aria-busy={loading || undefined}
      {...props}
    >
      <header className='erp-widget__header'>
        <div>
          <h3
            id={`${id}-title`}
            className='erp-widget__title'
          >
            {title}
          </h3>
          {subtitle && <p className='erp-widget__subtitle'>{subtitle}</p>}
        </div>
        {menuItems && menuItems.length > 0 && (
          <MenuButton
            size='sm'
            variant='ghost'
            aria-label={`${typeof title === 'string' ? title : 'Widget'} options`}
            icon={<Icon name='more-vertical' />}
            hideChevron
            placement='bottom-end'
            items={menuItems}
            onSelect={onMenuSelect}
          />
        )}
      </header>
      <div className='erp-widget__body'>
        {error ? (
          <Alert
            tone='error'
            actions={
              onRetry && (
                <Button
                  size='sm'
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )
            }
          >
            {error}
          </Alert>
        ) : (
          children
        )}
        {loading && (
          <div className='erp-widget__loading'>
            <Spinner />
          </div>
        )}
      </div>
      {footer && <footer className='erp-widget__footer'>{footer}</footer>}
    </section>
  )
}
