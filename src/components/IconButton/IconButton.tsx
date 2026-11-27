import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Button, type ButtonProps } from '../Button'
import { Icon, icons, type IconName } from '../Icon'
import { Tooltip } from '../Tooltip'
import '../Button/Button.css'
import './IconButton.css'

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconEnd' | 'fullWidth'> {
  /** Built-in icon name (see Icon) or any icon element. */
  icon: ReactNode
  /** Required: an icon-only button has no visible text. Also used as the tooltip. */
  'aria-label': string
  /** Tooltip content. Defaults to the aria-label; `false` hides it. */
  tooltip?: ReactNode | false
}

/** Icon-only button. `aria-label` is required and shown as a tooltip. */
export function IconButton({ icon, tooltip, variant = 'ghost', className, ...props }: IconButtonProps) {
  const button = (
    <Button
      variant={variant}
      className={cx('erp-icon-button', className)}
      icon={typeof icon === 'string' && icon in icons ? <Icon name={icon as IconName} /> : icon}
      {...props}
    />
  )
  if (tooltip === false) return button
  return <Tooltip content={tooltip ?? props['aria-label']}>{button}</Tooltip>
}
