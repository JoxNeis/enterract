import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a department record. Your data may have more fields. */
export interface Department {
  code: string
  name: string
}

export interface DepartmentLookupProps<T extends Department = Department> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard department columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Department selector: code and name. A preset of `Lookup`: pass your `dataSource`. */
export function DepartmentLookup<T extends Department = Department>({
  label = 'Department',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: DepartmentLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '4rem' },
      { key: 'name', header: 'Name', width: '2fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((d) => d.name))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
