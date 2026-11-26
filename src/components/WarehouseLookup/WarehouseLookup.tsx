import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a warehouse record. Your data may have more fields. */
export interface Warehouse {
  code: string
  name: string
}

export interface WarehouseLookupProps<T extends Warehouse = Warehouse> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard warehouse columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Warehouse selector: code and name. A preset of `Lookup`: pass your `dataSource`. */
export function WarehouseLookup<T extends Warehouse = Warehouse>({
  label = 'Warehouse',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: WarehouseLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '6rem' },
      { key: 'name', header: 'Name', width: '2fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((w) => `${w.code} · ${w.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
