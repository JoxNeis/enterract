import { Lookup, type LookupColumn, type LookupProps } from '../Lookup'

/** Minimum shape of a item record. Your data may have more fields. */
export interface Item {
  sku: string
  description: string
  uom?: string
  onHand?: number
}

export interface ItemLookupProps<T extends Item = Item> extends Omit<LookupProps<T>, 'columns' | 'displayValue'> {
  /** Result columns. Defaults to the standard item columns. */
  columns?: LookupColumn<T>[]
  /** Text in the input for the selected record. */
  displayValue?: (item: T) => string
}

/** Item / product selector: SKU, description, unit of measure and on-hand quantity. A preset of `Lookup`: pass your `dataSource`. */
export function ItemLookup<T extends Item = Item>({
  label = 'Item',
  columns,
  displayValue,
  dropdownWidth = '30rem',
  ...props
}: ItemLookupProps<T>) {
  return (
    <Lookup<T>
      label={label}
      columns={
        columns ??
        ([
      { key: 'sku', header: 'SKU', width: '6.5rem' },
      { key: 'description', header: 'Description', width: '2fr' },
      { key: 'uom', header: 'UoM', width: '3.5rem' },
      { key: 'onHand', header: 'On hand', width: '5rem', align: 'end' },
    ] as LookupColumn<T>[])
      }
      displayValue={displayValue ?? (((i) => `${i.sku} · ${i.description}`))}
      dropdownWidth={dropdownWidth}
      {...props}
    />
  )
}
