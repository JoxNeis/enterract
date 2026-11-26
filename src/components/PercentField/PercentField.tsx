import { roundTo } from '../../utils/number'
import { NumberField, type NumberFieldProps } from '../NumberField'

export interface PercentFieldProps extends Omit<NumberFieldProps, 'suffix'> {
  /**
   * How the value is stored. `fraction` (default): 0.15 is shown as 15%. `percent`: 15 is shown
   * as 15%. Pick one for the whole application. `min`/`max` are always in percent (0–100).
   */
  valueMode?: 'fraction' | 'percent'
}

/** Percentage input. Stores `0.15` and shows `15 %` by default (see `valueMode`). */
export function PercentField({
  valueMode = 'fraction',
  value,
  defaultValue,
  onChange,
  precision = 2,
  className,
  ...props
}: PercentFieldProps) {
  const toShown = (v: number | null | undefined) =>
    v === null || v === undefined ? v : valueMode === 'fraction' ? roundTo(v * 100, precision + 6) : v
  const toStored = (v: number | null) =>
    v === null ? null : valueMode === 'fraction' ? roundTo(v / 100, precision + 2) : v

  return (
    <NumberField
      {...props}
      className={['erp-percent-field', className].filter(Boolean).join(' ')}
      precision={precision}
      value={value === undefined ? undefined : toShown(value)}
      defaultValue={toShown(defaultValue)}
      suffix='%'
      onChange={(v, e) => {
        onChange?.(toStored(v), e)
      }}
    />
  )
}
