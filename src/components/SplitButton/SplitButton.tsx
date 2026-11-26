import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { Button, type ButtonVariant } from '../Button'
import { Icon } from '../Icon'
import { MenuButton, type MenuItem } from '../MenuButton'
import './SplitButton.css'

export interface SplitButtonProps {
  /** Main action label, e.g. "Save". */
  children: ReactNode
  /** Main action. */
  onClick: () => void
  /** Related actions in the dropdown, e.g. Save & New, Save as draft. */
  items: readonly MenuItem[]
  onSelect?: (key: string) => void
  variant?: ButtonVariant
  size?: Size
  icon?: ReactNode
  disabled?: boolean
  loading?: boolean
  /** Accessible name of the dropdown button. */
  menuLabel?: string
  className?: string
}

/** A main action with related actions in an attached dropdown. */
export function SplitButton({
  children,
  onClick,
  items,
  onSelect,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  menuLabel = 'More options',
  className,
}: SplitButtonProps) {
  return (
    <div
      className={cx('erp-split-button', className)}
      role='group'
      data-variant={variant}
    >
      <Button
        variant={variant}
        size={size}
        icon={icon}
        disabled={disabled}
        loading={loading}
        className='erp-split-button__main'
        onClick={onClick}
      >
        {children}
      </Button>
      <MenuButton
        variant={variant}
        size={size}
        items={items}
        onSelect={onSelect}
        disabled={disabled || loading}
        aria-label={menuLabel}
        icon={<Icon name='chevron-down' />}
        hideChevron
        placement='bottom-end'
        className='erp-split-button__toggle'
      />
    </div>
  )
}
