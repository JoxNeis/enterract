import type { ComponentProps } from 'react'
import '../styles/base.css'

/** Hidden visually, still read by screen readers. Internal. */
export function VisuallyHidden(props: ComponentProps<'span'>) {
  return <span className='erp-visually-hidden' {...props} />
}
