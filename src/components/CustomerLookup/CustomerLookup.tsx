import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a customer record. Your data may have more fields. */
export interface Customer {
  code: string
  name: string
  city?: string
}

export interface CustomerLookupProps<T extends Customer = Customer> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard customer columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Customer selector: code, name and city. A preset of `Lookup`: pass your `dataSource`. */
export function CustomerLookup<T extends Customer = Customer>({
  label = 'Customer',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: CustomerLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '6rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'city', header: 'City', width: '1fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((c) => `${c.code} · ${c.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
