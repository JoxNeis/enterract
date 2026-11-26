import type { FilterField, FilterGroup } from './filterModel'

export const orderFields: FilterField[] = [
  { key: 'customer', label: 'Customer', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'orderDate', label: 'Order date', type: 'date' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { key: 'open', label: 'Open' },
      { key: 'posted', label: 'Posted' },
      { key: 'cancelled', label: 'Cancelled' },
    ],
  },
  { key: 'rush', label: 'Rush', type: 'boolean' },
]

export const sampleFilter: FilterGroup = {
  kind: 'group',
  id: 'root',
  combinator: 'and',
  rules: [
    { kind: 'condition', id: 'c1', field: 'status', operator: 'equals', value: 'open' },
    {
      kind: 'group',
      id: 'g1',
      combinator: 'or',
      rules: [
        { kind: 'condition', id: 'c2', field: 'amount', operator: 'gt', value: 1000 },
        { kind: 'condition', id: 'c3', field: 'customer', operator: 'contains', value: 'acme' },
      ],
    },
  ],
}

export const orders = [
  { id: 1, customer: 'Acme Trading', amount: 400, orderDate: '2026-03-01', status: 'open', rush: false },
  { id: 2, customer: 'Delta Foods', amount: 2400, orderDate: '2026-03-05', status: 'open', rush: true },
  { id: 3, customer: 'Harbor Marine', amount: 800, orderDate: '2026-03-09', status: 'open', rush: false },
  { id: 4, customer: 'Acme Trading', amount: 5200, orderDate: '2026-03-12', status: 'posted', rush: false },
]
