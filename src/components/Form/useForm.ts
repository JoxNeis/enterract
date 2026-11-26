import { useCallback, useId, useMemo, useState, type SyntheticEvent } from 'react'
import { focusField } from '../../utils/focus'

export type FormValues = Record<string, unknown>
export type FormErrors<V extends FormValues> = Partial<Record<keyof V & string, string>>

export interface SubmitHelpers<V extends FormValues> {
  /** Set errors returned by the server; they show until the field changes. */
  setErrors: (errors: FormErrors<V>) => void
  /** Revert to `values` (or the baseline) and make it the new baseline: call `reset(values)` after a save. */
  reset: (values?: V) => void
}

export interface UseFormOptions<V extends FormValues> {
  initialValues: V
  /** Return an error message per invalid field. Runs on every change; shown after blur or submit. */
  validate?: (values: V) => FormErrors<V>
  /** Fields that must not be empty (`null`, `''` or `[]`). */
  required?: readonly (keyof V & string)[]
  requiredMessage?: (name: keyof V & string) => string
  onSubmit?: (values: V, helpers: SubmitHelpers<V>) => void | Promise<void>
  /** Prefix for field ids. Auto-generated when omitted. */
  id?: string
}

/** Props to spread onto any enterract form control: `<TextField label="Name" {...form.field('name')} />`. */
export interface FieldBinding<T> {
  id: string
  name: string
  value: T | null
  onChange: (value: T | null) => void
  onBlur: () => void
  error: string | undefined
  required: boolean
}

export interface FormApi<V extends FormValues> {
  id: string
  values: V
  /** All current errors (validation, required and server). */
  errors: FormErrors<V>
  /** Errors to show: for touched fields, or every field after a submit attempt. */
  visibleErrors: FormErrors<V>
  touched: Partial<Record<keyof V & string, boolean>>
  isDirty: boolean
  dirtyFields: (keyof V & string)[]
  isValid: boolean
  isSubmitting: boolean
  submitCount: number
  field: <K extends keyof V & string>(name: K) => FieldBinding<V[K]>
  setValue: <K extends keyof V & string>(name: K, value: V[K] | null) => void
  setValues: (values: Partial<V>) => void
  setErrors: (errors: FormErrors<V>) => void
  reset: (values?: V) => void
  /** Only the changed fields, for PATCH-style saves. */
  getChanges: () => Partial<V>
  handleSubmit: (event?: SyntheticEvent) => Promise<void>
  focusFirstError: () => void
}

const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Form state, dirty tracking, validation and submit handling. Pair with `<Form form={form}>`. */
export function useForm<V extends FormValues>(options: UseFormOptions<V>): FormApi<V> {
  const { validate, required = [], requiredMessage = () => 'Required', onSubmit } = options
  const autoId = useId()
  const id = options.id ?? `form${autoId.replace(/:/g, '')}`
  const [baseline, setBaseline] = useState<V>(options.initialValues)
  const [values, setValuesState] = useState<V>(options.initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof V & string, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<FormErrors<V>>({})
  const [isSubmitting, setSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)

  const errors = useMemo(() => {
    const result: FormErrors<V> = Object.assign({}, validate?.(values))
    for (const name of required) if (isEmpty(values[name]) && !result[name]) result[name] = requiredMessage(name)
    for (const [name, message] of Object.entries(serverErrors) as [keyof V & string, string | undefined][]) {
      if (message && !result[name]) result[name] = message
    }
    return result
  }, [values, validate, required, requiredMessage, serverErrors])

  const visibleErrors = useMemo(() => {
    if (submitCount > 0) return errors
    const result: FormErrors<V> = {}
    for (const [name, message] of Object.entries(errors) as [keyof V & string, string | undefined][]) {
      if (touched[name] || serverErrors[name]) result[name] = message
    }
    return result
  }, [errors, touched, submitCount, serverErrors])

  const dirtyFields = useMemo(
    () => (Object.keys(values) as (keyof V & string)[]).filter((k) => !same(values[k], baseline[k])),
    [values, baseline]
  )

  const setValue = useCallback(<K extends keyof V & string>(name: K, value: V[K] | null) => {
    setValuesState((prev) => ({ ...prev, [name]: value }))
    setServerErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }, [])

  /** Revert to `next` (or the current baseline) and make it the new baseline. */
  const reset = useCallback(
    (next?: V) => {
      const base = next ?? baseline
      setBaseline(base)
      setValuesState(base)
      setTouched({})
      setServerErrors({})
      setSubmitCount(0)
    },
    [baseline]
  )

  const focusFirstError = useCallback(() => {
    const first = (Object.keys(values) as (keyof V & string)[]).find((k) => errors[k])
    if (first) focusField(`${id}-${first}`)
  }, [errors, values, id])

  const api: FormApi<V> = {
    id,
    values,
    errors,
    visibleErrors,
    touched,
    isDirty: dirtyFields.length > 0,
    dirtyFields,
    isValid: Object.values(errors).every((e) => !e),
    isSubmitting,
    submitCount,
    field: (name) => ({
      id: `${id}-${name}`,
      name,
      value: (values[name] ?? null),
      onChange: (value) => {
        setValue(name, value)
      },
      onBlur: () => {
        setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
      },
      error: visibleErrors[name],
      required: required.includes(name),
    }),
    setValue,
    setValues: (partial) => {
      setValuesState((prev) => ({ ...prev, ...partial }))
    },
    setErrors: setServerErrors,
    reset,
    getChanges: () => Object.fromEntries(dirtyFields.map((k) => [k, values[k]])) as Partial<V>,
    focusFirstError,
    handleSubmit: async (event) => {
      event?.preventDefault()
      setSubmitCount((c) => c + 1)
      if (Object.values(errors).some(Boolean)) {
        requestAnimationFrame(focusFirstError)
        return
      }
      if (!onSubmit) return
      setSubmitting(true)
      try {
        await onSubmit(values, { setErrors: setServerErrors, reset })
      } finally {
        setSubmitting(false)
      }
    },
  }
  return api
}
