import type { ChangeEvent } from 'react'
import { InlineField } from '../../internal/InlineField'
import type { NativeInputProps } from '../../internal/nativeProps'
import { flag } from '../../utils/flag'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { useFieldProps } from '../FormField'
import '../../styles/base.css'
import './Switch.css'

export interface SwitchProps extends FieldProps, ValueProps<boolean, ChangeEvent<HTMLInputElement>>, NativeInputProps {
  /** Put the label before the switch (settings lists). */
  labelPosition?: 'start' | 'end'
}

/** On/off toggle for settings that apply immediately. Uses `role="switch"`. */
export function Switch(props: SwitchProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = false, onChange, labelPosition, onClick, ...native } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })

  return (
    <InlineField
      {...field}
      rootClassName='erp-switch'
      labelPosition={labelPosition}
      control={(f) => (
        <span
          className='erp-switch__track'
          data-checked={flag(current)}
          data-invalid={flag(f.invalid)}
        >
          <input
            type='checkbox'
            role='switch'
            className='erp-switch__input'
            checked={Boolean(current)}
            aria-checked={Boolean(current)}
            disabled={field.disabled}
            required={field.required}
            aria-readonly={flag(field.readOnly)}
            {...f.controlProps}
            {...native}
            onClick={onClick}
            onChange={(event) => {
              if (field.readOnly) return
              setCurrent(event.target.checked, event)
            }}
          />
          <span
            className='erp-switch__thumb'
            aria-hidden='true'
          />
        </span>
      )}
    />
  )
}
