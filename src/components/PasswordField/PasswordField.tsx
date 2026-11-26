import { useState } from 'react'
import { TextField, type TextFieldProps } from '../TextField'
import { Icon } from '../Icon'

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'suffix'> {
  /** Warn when Caps Lock is on while typing. */
  capsLockWarning?: boolean
}

/** Password input with a show/hide toggle and an optional Caps Lock warning. */
export function PasswordField({ capsLockWarning = true, warning, onKeyUp, autoComplete = 'current-password', ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [caps, setCaps] = useState(false)
  const editable = !props.disabled

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      spellCheck={false}
      warning={warning ?? (capsLockWarning && caps ? 'Caps Lock is on' : undefined)}
      onKeyUp={(event) => {
        if (capsLockWarning) setCaps(event.getModifierState('CapsLock'))
        onKeyUp?.(event)
      }}
      suffix={
        editable ? (
          <button
            type='button'
            className='erp-input-action'
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => {
              setVisible((v) => !v)
            }}
          >
            <Icon name={visible ? 'eye-off' : 'eye'} />
          </button>
        ) : undefined
      }
    />
  )
}
