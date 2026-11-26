/**
 * Deterministic sample master data for the ERP lookup presets (stories and tests).
 * No random values, no dates relative to "now".
 */
import { createInMemorySource } from '../components/Lookup/dataSource'

const pick = <T>(list: readonly T[], i: number): T => list[i % list.length] as T

const companyNames = ['Acme Trading', 'Borneo Logistics', 'Cahaya Elektrik', 'Delta Foods', 'Evergreen Paper', 'Fajar Motor', 'Global Steel', 'Harbor Marine', 'Indo Textiles', 'Jaya Pharma', 'Kencana Retail', 'Lumen Optics']
const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Hamburg', 'Munich', 'Singapore', 'Newark']
const people = ['Dewi Lestari', 'Markus Weber', 'Siti Rahma', 'Rudi Hartono', 'Anna Schmidt', 'Budi Santoso', 'Lena Fischer', 'Agus Pratama', 'Maria Rossi', 'Tom Becker', 'Rina Wijaya', 'Jonas Klein']
const depts = ['Finance', 'Purchasing', 'Sales', 'Warehouse', 'Production', 'HR']

export interface SampleCustomer { code: string; name: string; city: string }
export interface SampleVendor { code: string; name: string; city: string }
export interface SampleItem { sku: string; description: string; uom: string; onHand: number }
export interface SampleWarehouse { code: string; name: string }
export interface SampleEmployee { id: string; name: string; department: string; title: string }
export interface SampleAccount { number: string; name: string; type: string }
export interface SampleCodeName { code: string; name: string }
export interface SampleProject { code: string; name: string; status: string }
export interface SampleLocation { code: string; name: string; warehouse: string }
export interface SamplePartner { code: string; name: string; role: 'Customer' | 'Vendor' | 'Both' }

export const sampleCustomers: SampleCustomer[] = Array.from({ length: 36 }, (_, i) => ({ code: `C${String(1001 + i)}`, name: `${pick(companyNames, i)}${i >= 12 ? ` ${String(Math.floor(i / 12) + 1)}` : ''}`, city: pick(cities, i) }))
export const sampleVendors: SampleVendor[] = Array.from({ length: 20 }, (_, i) => ({ code: `V${String(2001 + i)}`, name: `${pick(companyNames, i + 5)} Supply`, city: pick(cities, i + 2) }))
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
export const sampleWarehouses: SampleWarehouse[] = [
  { code: 'JKT-01', name: 'Jakarta Main' },
  { code: 'SBY-01', name: 'Surabaya' },
  { code: 'HAM-01', name: 'Hamburg Port' },
  { code: 'SG-01', name: 'Singapore Jurong' },
]
export const sampleEmployees: SampleEmployee[] = people.map((name, i) => ({ id: `E${String(301 + i)}`, name, department: pick(depts, i), title: i % 3 === 0 ? 'Manager' : 'Specialist' }))
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
export const sampleCostCenters: SampleCodeName[] = ['Administration', 'Sales Jakarta', 'Sales Hamburg', 'Production line 1', 'Production line 2', 'IT'].map((name, i) => ({ code: `CC${String(100 + i * 10)}`, name }))
export const sampleProjects: SampleProject[] = ['ERP rollout', 'Warehouse automation', 'New plant Cikarang', 'ISO 9001 audit', 'Solar roof'].map((name, i) => ({ code: `P-26${String(i + 1).padStart(2, '0')}`, name, status: pick(['Active', 'Planned', 'On hold'], i) }))
export const sampleDepartments: SampleCodeName[] = depts.map((name, i) => ({ code: `D${String(10 + i)}`, name }))
export const sampleLocations: SampleLocation[] = Array.from({ length: 12 }, (_, i) => ({ code: `${pick(['A', 'B', 'C'], i)}-${String(Math.floor(i / 3) + 1).padStart(2, '0')}-${String((i % 3) + 1)}`, name: `Aisle ${pick(['A', 'B', 'C'], i)}, rack ${String(Math.floor(i / 3) + 1)}, level ${String((i % 3) + 1)}`, warehouse: pick(sampleWarehouses, i).code }))
export const samplePartners: SamplePartner[] = [
  ...sampleCustomers.slice(0, 6).map((c) => ({ code: c.code, name: c.name, role: 'Customer' as const })),
  ...sampleVendors.slice(0, 6).map((v) => ({ code: v.code, name: v.name, role: 'Vendor' as const })),
  { code: 'B9001', name: 'Global Steel Group', role: 'Both' },
]

const delay = 150
export const customerSource = createInMemorySource(sampleCustomers, { getKey: (c) => c.code, getLabel: (c) => c.name, searchFields: [(c) => c.code, (c) => c.name, (c) => c.city], delay })
export const vendorSource = createInMemorySource(sampleVendors, { getKey: (v) => v.code, getLabel: (v) => v.name, searchFields: [(v) => v.code, (v) => v.name], delay })
export const itemSource = createInMemorySource(sampleItems, { getKey: (i) => i.sku, getLabel: (i) => i.description, searchFields: [(i) => i.sku, (i) => i.description], delay })
export const warehouseSource = createInMemorySource(sampleWarehouses, { getKey: (w) => w.code, getLabel: (w) => w.name, searchFields: [(w) => w.code, (w) => w.name], delay })
export const employeeSource = createInMemorySource(sampleEmployees, { getKey: (e) => e.id, getLabel: (e) => e.name, searchFields: [(e) => e.name, (e) => e.department], delay })
export const accountSource = createInMemorySource(sampleAccounts, { getKey: (a) => a.number, getLabel: (a) => a.name, searchFields: [(a) => a.number, (a) => a.name], delay })
export const costCenterSource = createInMemorySource(sampleCostCenters, { getKey: (c) => c.code, getLabel: (c) => c.name, searchFields: [(c) => c.code, (c) => c.name], delay })
export const projectSource = createInMemorySource(sampleProjects, { getKey: (p) => p.code, getLabel: (p) => p.name, searchFields: [(p) => p.code, (p) => p.name], delay })
export const departmentSource = createInMemorySource(sampleDepartments, { getKey: (d) => d.code, getLabel: (d) => d.name, searchFields: [(d) => d.code, (d) => d.name], delay })
export const locationSource = createInMemorySource(sampleLocations, { getKey: (l) => l.code, getLabel: (l) => l.name, searchFields: [(l) => l.code, (l) => l.name], delay })
export const partnerSource = createInMemorySource(samplePartners, { getKey: (p) => p.code, getLabel: (p) => p.name, searchFields: [(p) => p.code, (p) => p.name], delay })

/** Instant versions for unit tests. */
export const instant = {
  customer: createInMemorySource(sampleCustomers, { getKey: (c) => c.code, getLabel: (c) => c.name, searchFields: [(c) => c.code, (c) => c.name] }),
  vendor: createInMemorySource(sampleVendors, { getKey: (v) => v.code, getLabel: (v) => v.name }),
  item: createInMemorySource(sampleItems, { getKey: (i) => i.sku, getLabel: (i) => i.description, searchFields: [(i) => i.sku, (i) => i.description] }),
  warehouse: createInMemorySource(sampleWarehouses, { getKey: (w) => w.code, getLabel: (w) => w.name }),
  employee: createInMemorySource(sampleEmployees, { getKey: (e) => e.id, getLabel: (e) => e.name }),
  account: createInMemorySource(sampleAccounts, { getKey: (a) => a.number, getLabel: (a) => a.name, searchFields: [(a) => a.number, (a) => a.name] }),
  costCenter: createInMemorySource(sampleCostCenters, { getKey: (c) => c.code, getLabel: (c) => c.name }),
  project: createInMemorySource(sampleProjects, { getKey: (p) => p.code, getLabel: (p) => p.name }),
  department: createInMemorySource(sampleDepartments, { getKey: (d) => d.code, getLabel: (d) => d.name }),
  location: createInMemorySource(sampleLocations, { getKey: (l) => l.code, getLabel: (l) => l.name }),
  partner: createInMemorySource(samplePartners, { getKey: (p) => p.code, getLabel: (p) => p.name }),
}
