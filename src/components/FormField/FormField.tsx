import { useId, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import type { FieldProps } from '../../utils/types'
import { FieldMessage } from '../FieldMessage'
import { Label } from '../Label'
import './FormField.css'
import { flag } from '../../utils/flag'

/** ARIA wiring to spread onto the focusable element. */
export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-required': true | undefined
}

export interface FormFieldRenderProps {
  id: string
  labelId: string
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  /** Spread onto the focusable element: id, aria-describedby, aria-invalid, aria-required. */
  controlProps: FieldControlProps
}

export interface FormFieldProps extends Omit<FieldProps, 'name'> {
  /** Render function that receives the ids and ARIA props for the control. */
  children: (field: FormFieldRenderProps) => ReactNode
  /** Label a group (radio group, checkbox group) with a `<span>` + aria-labelledby instead of `<label for>`. */
  group?: boolean
  /** Content after the label, e.g. a "calculated" marker or an info button. */
  labelExtra?: ReactNode
  /** Content under the control next to the messages, e.g. a character counter. */
  footer?: ReactNode
  /** `horizontal` puts the label to the left of the control. */
  layout?: 'vertical' | 'horizontal'
  style?: CSSProperties
}

/**
 * Wraps any input with its label, required marker, help text, error and warning, and wires
 * up the ARIA attributes. Every enterract form control renders through FormField.
 */
export function FormField({
  label,
  hideLabel,
  helpText,
  error,
  warning,
  required = false,
  invalid,
  disabled,
  readOnly,
  size = 'md',
  className,
  id,
  children,
  group,
  labelExtra,
  footer,
  layout = 'vertical',
  style,
}: FormFieldProps) {
  const autoId = useId()
  const controlId = id ?? `erp-${autoId}`
  const labelId = `${controlId}-label`
  const helpId = `${controlId}-help`
  const errorId = `${controlId}-error`
  const warningId = `${controlId}-warning`
  const isInvalid = invalid ?? (error != null && error !== false && error !== '')
  const hasError = error != null && error !== false && error !== ''
  const hasWarning = warning != null && warning !== false && warning !== ''
  const hasHelp = helpText != null && helpText !== false && helpText !== ''
  const describedBy =
    [hasError && errorId, hasWarning && warningId, hasHelp && helpId].filter(Boolean).join(' ') || undefined

  const field: FormFieldRenderProps = {
    id: controlId,
    labelId,
    describedBy,
    invalid: isInvalid,
    required,
    controlProps: {
      id: controlId,
      'aria-describedby': describedBy,
      'aria-invalid': flag(isInvalid),
      'aria-required': flag(required),
    },
  }

  return (
    <div
      className={cx('erp-form-field', className)}
      data-size={size}
      data-layout={layout}
      data-disabled={flag(disabled)}
      data-readonly={flag(readOnly)}
      data-invalid={flag(isInvalid)}
      style={style}
    >
      {label != null && (
        <div className={cx('erp-form-field__label-row', hideLabel && 'erp-visually-hidden')}>
          <Label
            id={labelId}
            htmlFor={group ? undefined : controlId}
            asSpan={group}
            required={required}
            size={size}
            disabled={disabled}
          >
            {label}
          </Label>
          {labelExtra}
        </div>
      )}
      <div className='erp-form-field__body'>
        {children(field)}
        {(hasError || hasWarning || hasHelp || footer != null) && (
          <div className={cx('erp-form-field__messages', hideLabel && !hasError && 'erp-visually-hidden')}>
            <div className='erp-form-field__message-list'>
              {hasError && (
                <FieldMessage
                  id={errorId}
                  tone='error'
                >
                  {error}
                </FieldMessage>
              )}
              {hasWarning && (
                <FieldMessage
                  id={warningId}
                  tone='warning'
                >
                  {warning}
                </FieldMessage>
              )}
              {hasHelp && <FieldMessage id={helpId}>{helpText}</FieldMessage>}
            </div>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
