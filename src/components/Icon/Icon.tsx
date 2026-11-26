import type { ComponentProps } from 'react'
import { cx } from '../../utils/cx'
import { icons, type IconName } from './icons'
import './Icon.css'

export interface IconProps extends Omit<ComponentProps<'svg'>, 'name'> {
  /** Icon from the built-in set. */
  name: IconName
  /** Pixel size. Defaults to 1em so the icon follows the font size. */
  size?: number | string
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  label?: string
}

/** SVG icon from the built-in set. Decorative unless `label` is given. */
export function Icon({ name, size = '1em', label, className, ...props }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cx('erp-icon', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable='false'
      data-icon={name}
      {...props}
    >
      {icons[name].map((d) => (
        <path
          key={d}
          d={d}
        />
      ))}
    </svg>
  )
}
