import type { Option } from '../../utils/types'
import { useControllableState } from '../../utils/useControllableState'
import { NumberField, type NumberFieldProps } from '../NumberField'
import './QuantityField.css'

export interface QuantityFieldProps extends Omit<NumberFieldProps, 'suffix'> {
  /** Fixed unit of measure shown after the number, e.g. `PCS`. */
  unit?: string
  /** Units to choose from: shows a selector instead of the fixed unit. */
  units?: readonly Option[]
  /** Selected unit (controlled). */
  unitValue?: string
  defaultUnit?: string
  onUnitChange?: (unit: string) => void
  /** Decimal places per unit, e.g. `{ PCS: 0, KG: 3 }`. Overrides `precision`. */
  unitPrecision?: Record<string, number>
}

/** Quantity with a unit of measure (fixed suffix or selector). Precision can follow the unit. */
export function QuantityField({
  unit,
  units,
  unitValue,
  defaultUnit,
  onUnitChange,
  unitPrecision,
  precision,
  className,
  ...props
}: QuantityFieldProps) {
  const [current, setUnit] = useControllableState({
    value: unitValue,
    defaultValue: defaultUnit ?? unit ?? units?.[0]?.key ?? '',
    onChange: onUnitChange,
  })
  const shownUnit = units ? current : (unit ?? current)
  const digits = shownUnit ? (unitPrecision?.[shownUnit] ?? precision) : precision

  const suffix = units ? (
    <select
      className='erp-quantity-field__unit'
      aria-label='Unit of measure'
      value={current}
      disabled={(props.disabled ?? false) || (props.readOnly ?? false)}
      onChange={(event) => {
        setUnit(event.target.value)
      }}
    >
      {units.map((u) => (
        <option
          key={u.key}
          value={u.key}
        >
          {u.key}
        </option>
      ))}
    </select>
  ) : (
    shownUnit || undefined
  )

  return (
    <NumberField
      {...props}
      className={['erp-quantity-field', className].filter(Boolean).join(' ')}
      precision={digits}
      suffix={suffix}
      data-unit={shownUnit}
    />
  )
}
