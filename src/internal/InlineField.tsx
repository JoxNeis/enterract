import { useId, type ReactNode } from 'react'
import { FieldMessage } from '../components/FieldMessage'
import type { FieldControlProps } from '../components/FormField'
import { cx } from '../utils/cx'
import { flag } from '../utils/flag'
import type { FieldProps } from '../utils/types'
import './InlineField.css'

export interface InlineFieldProps extends Omit<FieldProps, 'name'> {
  /** Renders the control (checkbox, switch). */
  control: (field: { controlProps: FieldControlProps; invalid: boolean }) => ReactNode
  /** Root class of the concrete component. */
  rootClassName: string
  /** Put the label before the control (switches in settings lists). */
  labelPosition?: 'start' | 'end'
}

/** Layout for controls whose label sits beside them: Checkbox, Switch. Internal. */
export function InlineField({
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
  control,
  rootClassName,
  labelPosition = 'end',
}: InlineFieldProps) {
  const autoId = useId()
  const controlId = id ?? `erp-${autoId}`
  const has = (node: ReactNode) => node != null && node !== false && node !== ''
  const isInvalid = invalid ?? has(error)
  const describedBy =
    [has(error) && `${controlId}-error`, has(warning) && `${controlId}-warning`, has(helpText) && `${controlId}-help`]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div
      className={cx('erp-inline-field', rootClassName, className)}
      data-size={size}
      data-disabled={flag(disabled)}
      data-readonly={flag(readOnly)}
      data-invalid={flag(isInvalid)}
      data-label-position={labelPosition}
    >
      <label
        className='erp-inline-field__row'
        htmlFor={controlId}
      >
        {control({
          invalid: isInvalid,
          controlProps: {
            id: controlId,
            'aria-describedby': describedBy,
            'aria-invalid': flag(isInvalid),
            'aria-required': flag(required),
          },
        })}
        {label != null && (
          <span className={cx('erp-inline-field__label', hideLabel && 'erp-visually-hidden')}>
            {label}
            {required && (
              <span
                className='erp-inline-field__required'
                aria-hidden='true'
              >
                *
              </span>
            )}
          </span>
        )}
      </label>
      {(has(error) || has(warning) || has(helpText)) && (
        <div className='erp-inline-field__messages'>
          {has(error) && (
            <FieldMessage
              id={`${controlId}-error`}
              tone='error'
            >
              {error}
            </FieldMessage>
          )}
          {has(warning) && (
            <FieldMessage
              id={`${controlId}-warning`}
              tone='warning'
            >
              {warning}
            </FieldMessage>
          )}
          {has(helpText) && <FieldMessage id={`${controlId}-help`}>{helpText}</FieldMessage>}
        </div>
      )}
    </div>
  )
}
