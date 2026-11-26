import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a cost center record. Your data may have more fields. */
export interface CostCenter {
  code: string
  name: string
}

export interface CostCenterLookupProps<T extends CostCenter = CostCenter> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard cost center columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Cost center selector: code and name. A preset of `Lookup`: pass your `dataSource`. */
export function CostCenterLookup<T extends CostCenter = CostCenter>({
  label = 'Cost center',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: CostCenterLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '5rem' },
      { key: 'name', header: 'Name', width: '2fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((c) => `${c.code} · ${c.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
