import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a vendor record. Your data may have more fields. */
export interface Vendor {
  code: string
  name: string
}

export interface VendorLookupProps<T extends Vendor = Vendor> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard vendor columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Vendor (supplier) selector: code and name. A preset of `Lookup`: pass your `dataSource`. */
export function VendorLookup<T extends Vendor = Vendor>({
  label = 'Vendor',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: VendorLookupProps<T>) {
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
      displayValue={displayValue ?? (((v) => `${v.code} · ${v.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
