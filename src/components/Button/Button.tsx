import type { ComponentProps } from 'react'
import './Button.css'

export type ButtonProps = ComponentProps<'button'>

export function Button({ className, type = 'button', ...props }: ButtonProps) {
  return (
    // `type` defaults to "button" so it never submits a surrounding form by accident
    <button
      type={type}
      className={['erp-button', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
