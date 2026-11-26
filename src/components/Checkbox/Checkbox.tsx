import { useLayoutEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { InlineField } from '../../internal/InlineField'
import type { NativeInputProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import { mergeRefs } from '../../utils/hooks'
import type { FieldProps, ValueProps } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { useFieldProps } from '../FormField'
import { Icon } from '../Icon'
import './Checkbox.css'

export interface CheckboxProps extends FieldProps, ValueProps<boolean, ChangeEvent<HTMLInputElement>>, NativeInputProps {
  /** Mixed state, e.g. a "select all" box when some rows are selected. Shown instead of the check. */
  indeterminate?: boolean
  /** Put the label before the box. */
  labelPosition?: 'start' | 'end'
}

/** Checkbox with label, help and error text. `null` is treated as unchecked. */
export function Checkbox(props: CheckboxProps) {
  const [field, rest] = useFieldProps(props)
  const { value, defaultValue = false, onChange, indeterminate = false, labelPosition, ref, onClick, ...native } = rest
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const inputRef = useRef<HTMLInputElement>(null)
  const mergedRef = useMemo(() => mergeRefs(inputRef, ref), [ref])

  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <InlineField
      {...field}
      rootClassName='erp-checkbox'
      labelPosition={labelPosition}
      control={(f) => (
        <span
          className={cx('erp-checkbox__box')}
          data-checked={flag(current)}
          data-indeterminate={flag(indeterminate)}
          data-invalid={flag(f.invalid)}
        >
          <input
            ref={mergedRef}
            type='checkbox'
            className='erp-checkbox__input'
            checked={Boolean(current)}
            disabled={field.disabled}
            required={field.required}
            aria-readonly={flag(field.readOnly)}
            {...f.controlProps}
            {...native}
            onClick={onClick}
            onChange={(event) => {
              if (field.readOnly) return
              setCurrent(event.target.checked, event)
            }}
          />
          <span
            className='erp-checkbox__mark'
            aria-hidden='true'
          >
            {indeterminate ? <Icon name='minus' /> : current ? <Icon name='check' /> : null}
          </span>
        </span>
      )}
    />
  )
}
