import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a project record. Your data may have more fields. */
export interface Project {
  code: string
  name: string
  status?: string
}

export interface ProjectLookupProps<T extends Project = Project> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard project columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Project selector: code, name and status. A preset of `Lookup`: pass your `dataSource`. */
export function ProjectLookup<T extends Project = Project>({
  label = 'Project',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: ProjectLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'code', header: 'Code', width: '5.5rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'status', header: 'Status', width: '1fr' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((p) => `${p.code} · ${p.name}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
