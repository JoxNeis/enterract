import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Icon, icons, type IconName } from '../Icon'
import './Fab.css'

export interface FabProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Icon name or element. */
  icon: ReactNode
  /** Required accessible name. */
  'aria-label': string
  /** Text next to the icon (extended FAB). */
  label?: ReactNode
  position?: 'bottom-right' | 'bottom-left' | 'static'
}

/** Floating primary action (mainly for touch layouts; rare on desktop ERP screens). */
export function Fab({ icon, label, position = 'bottom-right', className, type = 'button', ...props }: FabProps) {
  return (
    <button
      type={type}
      className={cx('erp-fab', className)}
      data-position={position}
      data-extended={label ? true : undefined}
      {...props}
    >
      {typeof icon === 'string' && icon in icons ? <Icon name={icon as IconName} /> : icon}
      {label && <span className='erp-fab__label'>{label}</span>}
    </button>
  )
}
