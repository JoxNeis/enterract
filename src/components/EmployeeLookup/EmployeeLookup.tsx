import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'
import { initials } from '../../utils/format'
import '../Lookup/presets.css'

/** Minimum shape of a employee record. Your data may have more fields. */
export interface Employee {
  id: string
  name: string
  department?: string
  title?: string
  avatarUrl?: string
}

export interface EmployeeLookupProps<T extends Employee = Employee> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard employee columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Employee selector: avatar, name and department. A preset of `Lookup`: pass your `dataSource`. */
export function EmployeeLookup<T extends Employee = Employee>({
  label = 'Employee',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: EmployeeLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      {
        key: 'avatar',
        header: '',
        width: '2rem',
        render: (e) => (
          <span
            className='erp-lookup-avatar'
            aria-hidden='true'
          >
            {e.avatarUrl ? (
              <img
                src={e.avatarUrl}
                alt=''
              />
            ) : (
              initials(e.name)
            )}
          </span>
        ),
      },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'department', header: 'Department', width: '1fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((e) => e.name))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
