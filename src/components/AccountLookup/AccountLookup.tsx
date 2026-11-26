import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a account record. Your data may have more fields. */
export interface Account {
  number: string
  name: string
  type?: string
}

export interface AccountLookupProps<T extends Account = Account> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard account columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** General ledger account selector: account number, name and type. A preset of `Lookup`: pass your `dataSource`. */
export function AccountLookup<T extends Account = Account>({
  label = 'Account',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: AccountLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'number', header: 'Account no.', width: '6rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'type', header: 'Type', width: '1fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((a) => `${a.number} · ${a.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
