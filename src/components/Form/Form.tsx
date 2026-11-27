import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { Size } from '../../utils/types'
import { Alert } from '../Alert'
import { FieldDefaultsProvider } from '../FormField'
import type { FormApi, FormValues } from './useForm'
import '../../styles/base.css'
import './Form.css'
import { flag } from '../../utils/flag'

export interface FormProps<V extends FormValues> extends Omit<ComponentProps<'form'>, 'onSubmit' | 'id'> {
  /** The object returned by `useForm`. */
  form: FormApi<V>
  /** After a failed submit, show an error banner with links to each invalid field. */
  errorSummary?: boolean
  errorSummaryTitle?: ReactNode
  /** Field names for the error summary. Defaults to the field key. */
  labels?: Partial<Record<keyof V & string, ReactNode>>
  /** Make every control inside read-only (posted / approved documents). */
  readOnly?: boolean
  /** Disable every control inside. */
  disabled?: boolean
  /** Density of every control inside. */
  size?: Size
  /** Grid layout with this many columns (fields span with `style={{ gridColumn: 'span 2' }}`). */
  columns?: number
}

/**
 * `<form>` wired to `useForm`: submit handling with `noValidate`, an error summary that links to
 * each field, and form-wide `readOnly`, `disabled` and `size`.
 */
export function Form<V extends FormValues>({
  form,
  errorSummary = true,
  errorSummaryTitle = 'Please fix the following before saving',
  labels = {},
  readOnly,
  disabled,
  size,
  columns,
  className,
  children,
  style,
  ...props
}: FormProps<V>) {
  const errorEntries = (Object.entries(form.errors) as [keyof V & string, string | undefined][]).filter(
    (entry): entry is [keyof V & string, string] => Boolean(entry[1])
  )
  const showSummary = errorSummary && form.submitCount > 0 && errorEntries.length > 0

  return (
    <form
      noValidate
      id={form.id}
      className={cx('erp-form', className)}
      aria-busy={flag(form.isSubmitting)}
      data-dirty={flag(form.isDirty)}
      onSubmit={(event) => {
        void form.handleSubmit(event)
      }}
      style={columns ? { ...style, gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` } : style}
      data-columns={columns}
      {...props}
    >
      {showSummary && (
        <Alert
          tone='error'
          title={errorSummaryTitle}
          className='erp-form__summary'
          errors={errorEntries.map(([name, message]) => ({
            fieldId: `${form.id}-${name}`,
            label: labels[name] ?? name,
            message,
          }))}
        />
      )}
      <FieldDefaultsProvider
        readOnly={readOnly}
        disabled={disabled}
        size={size}
      >
        {children}
      </FieldDefaultsProvider>
    </form>
  )
}
