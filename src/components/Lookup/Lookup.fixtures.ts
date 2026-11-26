import { createInMemorySource } from './dataSource'

export interface Customer {
  code: string
  name: string
  city: string
  creditLimit: number
}

const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Hamburg', 'Munich', 'Singapore', 'Newark', 'Austin']
const names = [
  'Acme Trading',
  'Borneo Logistics',
  'Cahaya Elektrik',
  'Delta Foods',
  'Evergreen Paper',
  'Fajar Motor',
  'Global Steel',
  'Harbor Marine',
  'Indo Textiles',
  'Jaya Pharma',
  'Kencana Retail',
  'Lumen Optics',
  'Maju Bersama',
  'Nusantara Agro',
  'Orion Chemicals',
  'Pacific Tools',
]

/** 48 customers with fixed codes (deterministic). */
export const customers: Customer[] = Array.from({ length: 48 }, (_, i) => ({
  code: `C${String(1001 + i)}`,
  name: `${names[i % names.length] ?? 'Customer'}${i >= names.length ? ` ${String(Math.floor(i / names.length) + 1)}` : ''}`,
  city: cities[i % cities.length] ?? 'Jakarta',
  creditLimit: ((i * 37) % 20) * 5000 + 10000,
}))

/** Server-like source: paged search over code and name, 200 ms delay. */
export const customerSource = createInMemorySource<Customer>(customers, {
  getKey: (c) => c.code,
  getLabel: (c) => c.name,
  searchFields: [(c) => c.code, (c) => c.name, (c) => c.city],
  delay: 200,
})

/** Same data without delay, for tests. */
export const instantCustomerSource = createInMemorySource<Customer>(customers, {
  getKey: (c) => c.code,
  getLabel: (c) => c.name,
  searchFields: [(c) => c.code, (c) => c.name, (c) => c.city],
})
