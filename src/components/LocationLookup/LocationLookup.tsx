import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a location record. Your data may have more fields. */
export interface Location {
  code: string
  name: string
  warehouse?: string
}

export interface LocationLookupProps<T extends Location = Location> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard location columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Storage location (bin) selector: code, name and warehouse. A preset of `Lookup`: pass your `dataSource`. */
export function LocationLookup<T extends Location = Location>({
  label = 'Location',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: LocationLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Bin', width: '5.5rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'warehouse', header: 'Warehouse', width: '5.5rem' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((l) => `${l.code} · ${l.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
