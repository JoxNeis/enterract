import type { Option } from '../../utils/types'
import { createInMemorySource } from '../Lookup'
import type { GridColumn, GridRow, GridRowInput } from './types'

/** An order line, as edited in the grid. */
export interface Line {
  itemId: string | null
  qty: number | null
  uom: string | null
  taxable: boolean
  unitPrice: string | null
  deliveryDate: string | null
  note: string | null
}

/** Server data the grid never shows: ids, concurrency version, posting flag. */
export interface LineMeta {
  lineId: number
  version: number
  posted: boolean
}

export interface Item {
  sku: string
  description: string
  uom: string
  onHand: number
}

export const items: Item[] = [
  { sku: 'BOLT-M6', description: 'Hex bolt M6 × 20', uom: 'PCS', onHand: 1200 },
  { sku: 'BOLT-M8', description: 'Hex bolt M8 × 30', uom: 'PCS', onHand: 860 },
  { sku: 'NUT-M6', description: 'Hex nut M6', uom: 'PCS', onHand: 4300 },
  { sku: 'WASH-6', description: 'Flat washer 6 mm', uom: 'BOX', onHand: 75 },
  { sku: 'PIPE-20', description: 'Steel pipe 20 mm', uom: 'M', onHand: 310 },
  { sku: 'PAINT-W', description: 'Primer paint, white', uom: 'L', onHand: 42 },
  { sku: 'GLOVE-L', description: 'Work gloves, size L', uom: 'BOX', onHand: 18 },
  { sku: 'TAPE-50', description: 'Duct tape 50 mm', uom: 'PCS', onHand: 0 },
  { sku: 'CABLE-3', description: 'Cable 3 × 1.5 mm²', uom: 'M', onHand: 950 },
  { sku: 'DRILL-8', description: 'Drill bit 8 mm', uom: 'PCS', onHand: 64 },
]

/** In-memory lookup with a small fixed delay, so loading is visible but deterministic. */
export const itemSource = createInMemorySource<Item>(items, {
  getKey: (i) => i.sku,
  getLabel: (i) => i.description,
  searchFields: [(i) => i.sku, (i) => i.description],
  delay: 150,
})

export const uomOptions: Option[] = [
  { key: 'PCS', label: 'Pieces' },
  { key: 'BOX', label: 'Box' },
  { key: 'M', label: 'Meter' },
  { key: 'L', label: 'Liter' },
  { key: 'KG', label: 'Kilogram' },
]

export const lineColumns: GridColumn<Line, LineMeta>[] = [
  {
    field: 'itemId',
    header: 'Item',
    editor: 'lookup',
    lookup: itemSource as GridColumn<Line, LineMeta>['lookup'],
    required: true,
    width: 200,
    frozen: true,
    readOnly: (row) => row.meta.posted,
  },
  {
    field: 'qty',
    header: 'Qty',
    editor: 'number',
    precision: 2,
    required: true,
    width: 90,
    aggregate: 'sum',
    readOnly: (row) => row.meta.posted,
    validate: (v) => (typeof v === 'number' && v <= 0 ? 'Must be more than 0' : undefined),
  },
  { field: 'uom', header: 'UoM', editor: 'select', options: uomOptions, width: 110, readOnly: (row) => row.meta.posted },
  { field: 'taxable', header: 'Taxable', editor: 'checkbox', width: 80, readOnly: (row) => row.meta.posted },
  { field: 'unitPrice', header: 'Unit price', editor: 'currency', currency: 'USD', width: 120, readOnly: (row) => row.meta.posted },
  { field: 'deliveryDate', header: 'Delivery', editor: 'date', width: 120 },
  { field: 'note', header: 'Note', editor: 'text', width: 220 },
]

const input: GridRowInput<Line, LineMeta>[] = [
  {
    id: '101',
    data: { itemId: 'BOLT-M6', qty: 100, uom: 'PCS', taxable: true, unitPrice: '0.12', deliveryDate: '2026-03-20', note: null },
    meta: { lineId: 101, version: 3, posted: false },
  },
  {
    id: '102',
    data: { itemId: 'NUT-M6', qty: 100, uom: 'PCS', taxable: true, unitPrice: '0.05', deliveryDate: '2026-03-20', note: null },
    meta: { lineId: 102, version: 1, posted: false },
  },
  {
    id: '103',
    data: { itemId: 'PIPE-20', qty: 12.5, uom: 'M', taxable: false, unitPrice: '4.80', deliveryDate: '2026-03-22', note: 'Cut to 2.5 m' },
    meta: { lineId: 103, version: 7, posted: true },
  },
  {
    id: '104',
    data: { itemId: 'PAINT-W', qty: null, uom: 'L', taxable: true, unitPrice: '18.00', deliveryDate: null, note: 'Qty missing' },
    meta: { lineId: 104, version: 2, posted: false },
  },
  {
    id: '105',
    data: { itemId: 'GLOVE-L', qty: 4, uom: 'BOX', taxable: true, unitPrice: '22.50', deliveryDate: '2026-03-25', note: null },
    meta: { lineId: 105, version: 1, posted: false },
  },
]

/** Five lines: one posted (locked) and one with a validation error (qty missing). */
export const lineRows: GridRow<Line, LineMeta>[] = input.map((r) => ({
  ...r,
  status: 'unchanged',
  original: { ...r.data },
}))

/** 60 lines for scrolling and frozen-column stories. Deterministic: no random values. */
export const manyLineRows: GridRow<Line, LineMeta>[] = Array.from({ length: 60 }, (_, i) => {
  const item = items[i % items.length]
  if (!item) throw new Error('unreachable')
  const data: Line = {
    itemId: item.sku,
    qty: ((i * 7) % 50) + 1,
    uom: item.uom,
    taxable: i % 3 !== 0,
    unitPrice: `${String((i % 9) + 1)}.${String((i * 13) % 100).padStart(2, '0')}`,
    deliveryDate: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    note: i % 5 === 0 ? `Batch ${String(i)}` : null,
  }
  return { id: String(1000 + i), data, meta: { lineId: 1000 + i, version: 1, posted: i % 17 === 0 }, status: 'unchanged', original: { ...data } }
})

export const newLine = (): Line => ({
  itemId: null,
  qty: 1,
  uom: 'PCS',
  taxable: true,
  unitPrice: null,
  deliveryDate: null,
  note: null,
})

export const newLineMeta = (): LineMeta => ({ lineId: 0, version: 0, posted: false })

/** Cascading select: the Subcategory options depend on the row's Category. */
export interface Product {
  name: string | null
  category: string | null
  subcategory: string | null
}

export const categoryOptions: Option[] = [
  { key: 'fasteners', label: 'Fasteners' },
  { key: 'tools', label: 'Tools' },
]

export const subcategoryOptions: Record<string, Option[]> = {
  fasteners: [
    { key: 'bolts', label: 'Bolts' },
    { key: 'nuts', label: 'Nuts' },
  ],
  tools: [
    { key: 'drills', label: 'Drills' },
    { key: 'saws', label: 'Saws' },
  ],
}

export const productColumns: GridColumn<Product>[] = [
  { field: 'name', header: 'Product', editor: 'text', width: 180 },
  { field: 'category', header: 'Category', editor: 'select', options: categoryOptions, width: 150 },
  {
    field: 'subcategory',
    header: 'Subcategory',
    editor: 'select',
    width: 150,
    options: (row) => (row.data.category ? (subcategoryOptions[row.data.category] ?? []) : []),
    validate: (v, row) =>
      v && row.data.category && !(subcategoryOptions[row.data.category] ?? []).some((o) => o.key === v)
        ? 'Not in this category'
        : undefined,
  },
]

export const productRows: GridRow<Product>[] = [
  { id: 'p1', data: { name: 'M6 bolt', category: 'fasteners', subcategory: 'bolts' }, meta: undefined, status: 'unchanged', original: { name: 'M6 bolt', category: 'fasteners', subcategory: 'bolts' } },
  { id: 'p2', data: { name: 'Cordless drill', category: 'tools', subcategory: 'drills' }, meta: undefined, status: 'unchanged', original: { name: 'Cordless drill', category: 'tools', subcategory: 'drills' } },
]
