import type { NativeDivProps } from '../../internal/nativeProps'
import { cx } from '../../utils/cx'
import { flag } from '../../utils/flag'
import type { FieldProps, Key, Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { Checkbox } from '../Checkbox'
import { FieldDefaultsProvider, FormField, useFieldProps } from '../FormField'
import './CheckboxGroup.css'

export interface CheckboxGroupProps<K extends Key = string> extends FieldProps, NativeDivProps {
  options: readonly Option<K>[]
  value?: readonly K[] | null
  defaultValue?: readonly K[] | null
  onChange?: (value: K[]) => void
  orientation?: 'vertical' | 'horizontal'
  /** Adds a "Select all" checkbox with the mixed state. */
  selectAll?: boolean | string
}

/** Several independent choices from a short list. */
export function CheckboxGroup<K extends Key = string>(props: CheckboxGroupProps<K>) {
  const [field, rest] = useFieldProps(props)
  const { options, value, defaultValue = [], onChange, orientation = 'vertical', selectAll = false, name, ...native } = rest
  const [raw, setRaw] = useControllableState<readonly K[] | null>({
    value,
    defaultValue,
    onChange: onChange ? (v) => { onChange([...(v ?? [])]) } : undefined,
  })
  const current = raw ?? []
  const enabled = options.filter((o) => !o.disabled)
  const all = enabled.length > 0 && enabled.every((o) => current.includes(o.key))
  const some = enabled.some((o) => current.includes(o.key))

  return (
    <FormField
      {...field}
      group
      className={cx('erp-checkbox-group', field.className)}
    >
      {(f) => (
        <div
          role='group'
          id={f.id}
          aria-labelledby={field.label != null ? f.labelId : undefined}
          aria-describedby={f.describedBy}
          aria-invalid={flag(f.invalid)}
          aria-required={flag(field.required)}
          className='erp-checkbox-group__options'
          data-orientation={orientation}
          {...native}
        >
          <FieldDefaultsProvider
            size={field.size}
            readOnly={field.readOnly}
            disabled={field.disabled}
          >
            {selectAll && (
              <Checkbox
                label={typeof selectAll === 'string' ? selectAll : 'Select all'}
                className='erp-checkbox-group__all'
                value={all}
                indeterminate={some && !all}
                onChange={(on) => {
                  setRaw(on ? [...new Set([...current, ...enabled.map((o) => o.key)])] : current.filter((k) => !enabled.some((o) => o.key === k)))
                }}
              />
            )}
            {options.map((o) => (
              <Checkbox
                key={String(o.key)}
                label={o.label}
                helpText={o.description}
                name={name}
                value={current.includes(o.key)}
                disabled={o.disabled}
                invalid={f.invalid}
                onChange={(on) => {
                  setRaw(on ? [...current, o.key] : current.filter((k) => k !== o.key))
                }}
              />
            ))}
          </FieldDefaultsProvider>
        </div>
      )}
    </FormField>
  )
}
