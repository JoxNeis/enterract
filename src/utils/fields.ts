import type { FieldProps } from './types'

const FIELD_KEYS = [
  'label',
  'hideLabel',
  'helpText',
  'error',
  'warning',
  'required',
  'invalid',
  'disabled',
  'readOnly',
  'size',
  'className',
  'id',
] as const

type FieldKey = (typeof FIELD_KEYS)[number]

/** Splits the FormField props from the rest so the rest can go to the native element. */
export function splitFieldProps<P extends Partial<Pick<FieldProps, FieldKey>>>(
  props: P
): [Pick<FieldProps, FieldKey>, Omit<P, FieldKey>] {
  const field: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if ((FIELD_KEYS as readonly string[]).includes(key)) field[key] = value
    else rest[key] = value
  }
  return [field, rest as Omit<P, FieldKey>]
}
