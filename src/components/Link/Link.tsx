import type { ComponentProps, MouseEvent } from 'react'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { Icon } from '../Icon'
import '../../styles/base.css'
import './Link.css'

export interface LinkProps extends ComponentProps<'a'> {
  /** Opens in a new tab with `rel="noopener noreferrer"` and shows an external icon. */
  external?: boolean
  /** Looks and acts disabled (no navigation, aria-disabled). */
  disabled?: boolean
  /** `subtle` inherits the text color (links in grids). */
  variant?: 'default' | 'subtle'
}

/** Navigation link. Use Button for actions. Wrap your router's Link with the `erp-link` class if needed. */
export function Link({ external = false, disabled = false, variant = 'default', className, children, onClick, href, target, rel, ...props }: LinkProps) {
  return (
    <a
      className={cx('erp-link', className)}
      data-variant={variant}
      href={disabled ? undefined : href}
      aria-disabled={flag(disabled)}
      target={external ? '_blank' : target}
      rel={external ? 'noopener noreferrer' : rel}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      {children}
      {external && (
        <>
          <Icon
            name='external'
            className='erp-link__icon'
          />
          <span className='erp-visually-hidden'> (opens in a new tab)</span>
        </>
      )}
    </a>
  )
}
