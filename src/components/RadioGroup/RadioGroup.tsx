import type { ChangeEvent } from 'react'
import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps, Key, Option, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { FormField, useFieldProps } from '../FormField'
import './RadioGroup.css'

export interface RadioGroupProps<K extends Key = string>
  extends FieldProps, ValueProps<K, ChangeEvent<HTMLInputElement>>, NativeDivProps {
  options: readonly Option<K>[]
  /** `horizontal` for 2–4 short options. */
  orientation?: 'vertical' | 'horizontal'
}

/** One choice from a short list (2–6 options). Arrow keys move and select, as with native radios. */
export function RadioGroup<K extends Key = string>(props: RadioGroupProps<K>) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = null, onChange, options, orientation = 'vertical', name, onKeyDown, ...native } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })

  return (
    <FormField
      {...field}
      group
      className={cx('erp-radio-group', field.className)}
    >
      {(f) => (
        <div
          role='radiogroup'
          aria-labelledby={f.labelId}
          aria-describedby={f.describedBy}
          aria-invalid={flag(f.invalid)}
          aria-required={flag(field.required)}
          aria-readonly={flag(field.readOnly)}
          aria-disabled={flag(field.disabled)}
          id={f.id}
          className='erp-radio-group__options'
          data-orientation={orientation}
          data-size={field.size}
          {...native}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            // Read-only: allow focus, block the native arrow-key selection.
            if (field.readOnly && event.key.startsWith('Arrow')) event.preventDefault()
          }}
        >
          {options.map((option, index) => {
            const checked = current === option.key
            const optionId = `${f.id}-${String(index)}`
            const disabled = field.disabled || option.disabled
            return (
              <label
                key={String(option.key)}
                className='erp-radio-group__option'
                htmlFor={optionId}
                data-disabled={flag(disabled)}
              >
                <span
                  className='erp-radio-group__control'
                  data-checked={flag(checked)}
                  data-invalid={flag(f.invalid)}
                >
                  <input
                    id={optionId}
                    type='radio'
                    className='erp-radio-group__input'
                    name={name ?? f.id}
                    value={String(option.key)}
                    checked={checked}
                    disabled={disabled}
                    required={field.required}
                    aria-labelledby={`${optionId}-label`}
                    aria-describedby={option.description ? `${optionId}-desc` : undefined}
                    tabIndex={current === null ? (index === 0 ? 0 : -1) : checked ? 0 : -1}
                    onChange={(event) => {
                      if (field.readOnly) return
                      if (event.target.checked) setCurrent(option.key, event)
                    }}
                  />
                  <span
                    className='erp-radio-group__dot'
                    aria-hidden='true'
                  />
                </span>
                <span className='erp-radio-group__text'>
                  <span id={`${optionId}-label`}>{option.label}</span>
                  {option.description && (
                    <span
                      id={`${optionId}-desc`}
                      className='erp-radio-group__description'
                    >
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </FormField>
  )
}
