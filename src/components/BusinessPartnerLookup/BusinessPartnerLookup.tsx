import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a business partner record. Your data may have more fields. */
export interface BusinessPartner {
  code: string
  name: string
  /** Customer, vendor or both. */
  role?: 'Customer' | 'Vendor' | 'Both'
}

export interface BusinessPartnerLookupProps<T extends BusinessPartner = BusinessPartner> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard business partner columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Business partner selector: the union of customers and vendors, with their role. A preset of `Lookup`: pass your `dataSource`. */
export function BusinessPartnerLookup<T extends BusinessPartner = BusinessPartner>({
  label = 'Business partner',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: BusinessPartnerLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '6rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'role', header: 'Role', width: '6rem' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((p) => `${p.code} · ${p.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
