import { createContext, useContext } from 'react'
import { splitFieldProps } from '../../utils/fields'
import type { FieldProps, Size } from '../../utils/types'

/** Defaults applied to every form control below a provider (Form, FieldDefaultsProvider, grid editors). */
export interface FieldDefaults {
  readOnly?: boolean
  disabled?: boolean
  size?: Size
}

export const FieldDefaultsContext = createContext<FieldDefaults>({})

/**
 * Splits FormField props from native props and applies defaults from the nearest Form or
 * FieldDefaultsProvider. A prop set on the control wins over the context default; `readOnly` and
 * `disabled` from the context can only turn the state on.
 */
export function useFieldProps<P extends Partial<FieldProps>>(props: P) {
  const defaults = useContext(FieldDefaultsContext)
  const [field, rest] = splitFieldProps(props)
  return [
    {
      ...field,
      readOnly: (field.readOnly ?? false) || (defaults.readOnly ?? false),
      disabled: (field.disabled ?? false) || (defaults.disabled ?? false),
      size: field.size ?? defaults.size ?? 'md',
    },
    rest,
  ] as const
}
