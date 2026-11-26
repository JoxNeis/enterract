import { useContext, useMemo, type ReactNode } from 'react'
import { FieldDefaultsContext, type FieldDefaults } from './fieldDefaults'

export interface FieldDefaultsProviderProps extends FieldDefaults {
  children?: ReactNode
}

/**
 * Makes every form control below it read-only, disabled or compact, e.g. a posted document:
 * `<FieldDefaultsProvider readOnly>`.
 */
export function FieldDefaultsProvider({ readOnly, disabled, size, children }: FieldDefaultsProviderProps) {
  const parent = useContext(FieldDefaultsContext)
  const value = useMemo<FieldDefaults>(
    () => ({
      readOnly: Boolean(readOnly) || Boolean(parent.readOnly),
      disabled: Boolean(disabled) || Boolean(parent.disabled),
      size: size ?? parent.size,
    }),
    [readOnly, disabled, size, parent]
  )
  return <FieldDefaultsContext value={value}>{children}</FieldDefaultsContext>
}
