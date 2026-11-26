import type { ReactNode, Ref } from 'react'
import type { FieldControlProps } from '../components/FormField'
import { Icon, type IconName } from '../components/Icon'
import { flag } from '../utils/flag'
import type { Size } from '../utils/types'
import { InputShell } from './InputShell'
import '../components/Select/Select.css'

export interface PickerTriggerProps {
  ref?: Ref<HTMLDivElement>
  controlProps: FieldControlProps
  labelId?: string
  open: boolean
  onToggle: () => void
  text: ReactNode
  placeholder: string
  icon: IconName
  size: Size
  invalid: boolean
  disabled: boolean
  readOnly: boolean
  'aria-label'?: string
}

/** Select-like button that opens a dialog popover (MonthPicker, YearPicker, FiscalPeriodPicker). Internal. */
export function PickerTrigger({
  ref,
  controlProps,
  labelId,
  open,
  onToggle,
  text,
  placeholder,
  icon,
  size,
  invalid,
  disabled,
  readOnly,
  'aria-label': ariaLabel,
}: PickerTriggerProps) {
  const interactive = !disabled && !readOnly
  return (
    <InputShell
      ref={ref}
      role='button'
      tabIndex={disabled ? -1 : 0}
      aria-haspopup='dialog'
      aria-expanded={open}
      aria-labelledby={ariaLabel ? undefined : labelId ? `${labelId} ${controlProps.id}-value` : undefined}
      aria-label={ariaLabel}
      aria-disabled={flag(disabled)}
      aria-readonly={flag(readOnly)}
      className='erp-select__trigger'
      size={size}
      invalid={invalid}
      disabled={disabled}
      readOnly={readOnly}
      suffix={<Icon name={icon} />}
      {...controlProps}
      onClick={() => {
        if (interactive) onToggle()
      }}
      onKeyDown={(event) => {
        if (!interactive) return
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault()
          onToggle()
        }
      }}
    >
      <span
        id={`${controlProps.id}-value`}
        className='erp-select__value'
        data-placeholder={flag(text === null || text === '')}
      >
        {text === null || text === '' ? placeholder : text}
      </span>
    </InputShell>
  )
}
