/**
 * Deterministic sample master data for stories and tests (people, accounts, items).
 * No random values, no dates relative to "now".
 */
import { createInMemorySource } from '../components/Lookup/dataSource'

const pick = <T>(list: readonly T[], i: number): T => list[i % list.length] as T

const people = ['Dewi Lestari', 'Markus Weber', 'Siti Rahma', 'Rudi Hartono', 'Anna Schmidt', 'Budi Santoso', 'Lena Fischer', 'Agus Pratama', 'Maria Rossi', 'Tom Becker', 'Rina Wijaya', 'Jonas Klein']
const depts = ['Finance', 'Purchasing', 'Sales', 'Warehouse', 'Production', 'HR']

export interface SampleItem {
  sku: string
  description: string
  uom: string
  onHand: number
}
export interface SampleEmployee {
  id: string
  name: string
  department: string
  title: string
}
export interface SampleAccount {
  number: string
  name: string
  type: string
}

export const sampleItems: SampleItem[] = [
  { sku: 'BOLT-M6', description: 'Hex bolt M6 × 20', uom: 'PCS', onHand: 1200 },
  { sku: 'BOLT-M8', description: 'Hex bolt M8 × 30', uom: 'PCS', onHand: 860 },
  { sku: 'NUT-M6', description: 'Hex nut M6', uom: 'PCS', onHand: 4300 },
  { sku: 'WASH-6', description: 'Flat washer 6 mm', uom: 'BOX', onHand: 75 },
  { sku: 'PIPE-20', description: 'Steel pipe 20 mm', uom: 'M', onHand: 310 },
  { sku: 'PAINT-W', description: 'Primer paint, white', uom: 'L', onHand: 42 },
  { sku: 'GLOVE-L', description: 'Work gloves, size L', uom: 'BOX', onHand: 18 },
  { sku: 'TAPE-50', description: 'Duct tape 50 mm', uom: 'PCS', onHand: 0 },
]
export const sampleEmployees: SampleEmployee[] = people.map((name, i) => ({
  id: `E${String(301 + i)}`,
  name,
  department: pick(depts, i),
  title: i % 3 === 0 ? 'Manager' : 'Specialist',
}))
export const sampleAccounts: SampleAccount[] = [
  { number: '1110', name: 'Cash', type: 'Asset' },
  { number: '1120', name: 'Bank accounts', type: 'Asset' },
  { number: '1130', name: 'Accounts receivable', type: 'Asset' },
  { number: '2100', name: 'Accounts payable', type: 'Liability' },
  { number: '2200', name: 'Taxes payable', type: 'Liability' },
  { number: '3100', name: 'Share capital', type: 'Equity' },
  { number: '4000', name: 'Sales revenue', type: 'Revenue' },
  { number: '5000', name: 'Cost of goods sold', type: 'Expense' },
  { number: '6100', name: 'Salaries', type: 'Expense' },
  { number: '6200', name: 'Rent', type: 'Expense' },
]

const delay = 150
export const itemSource = createInMemorySource(sampleItems, {
  getKey: (i) => i.sku,
  getLabel: (i) => i.description,
  searchFields: [(i) => i.sku, (i) => i.description],
  delay,
})
export const employeeSource = createInMemorySource(sampleEmployees, {
  getKey: (e) => e.id,
  getLabel: (e) => e.name,
  searchFields: [(e) => e.name, (e) => e.department],
  delay,
})
export const accountSource = createInMemorySource(sampleAccounts, {
  getKey: (a) => a.number,
  getLabel: (a) => a.name,
  searchFields: [(a) => a.number, (a) => a.name],
  delay,
})

/** Instant versions for unit tests. */
export const instant = {
  employee: createInMemorySource(sampleEmployees, { getKey: (e) => e.id, getLabel: (e) => e.name }),
}
