import { useCallback, useState } from 'react'

interface Options<T, E> {
  value: T | undefined
  defaultValue: T
  onChange?: ((value: T, event?: E) => void) | undefined
}

/**
 * Supports both controlled (`value` given) and uncontrolled use. The mode is fixed at mount
 * (FORM-CONTROL-CONTRACT rule 1): a control never switches between the two.
 */
export function useControllableState<T, E = never>({
  value,
  defaultValue,
  onChange,
}: Options<T, E>): [T, (next: T, event?: E) => void] {
  const [isControlled] = useState(value !== undefined)
  const [internal, setInternal] = useState<T>(defaultValue)
  const current = isControlled ? (value as T) : internal

  const setValue = useCallback(
    (next: T, event?: E) => {
      if (!isControlled) setInternal(next)
      onChange?.(next, event)
    },
    [isControlled, onChange]
  )

  return [current, setValue]
}
