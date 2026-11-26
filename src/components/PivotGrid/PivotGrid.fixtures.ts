import type { PivotConfig } from './pivot'

const regions = ['Jakarta', 'Surabaya', 'Hamburg']
const categories = ['Fasteners', 'Tools', 'Paint']
const quarters = ['Q1', 'Q2']

/** 18 deterministic sales records. */
export const salesRecords = regions.flatMap((region, r) =>
  categories.flatMap((category, c) =>
    quarters.map((quarter, q) => ({
      region,
      category,
      quarter,
      revenue: 1000 * (r + 1) + 250 * c + 100 * q,
      orders: 3 + r + c + q,
    }))
  )
)

export const salesConfig: PivotConfig = {
  rows: ['region', 'category'],
  columns: ['quarter'],
  values: [{ field: 'revenue', aggregate: 'sum' }],
}

export const salesFieldLabels: Record<string, string> = {
  region: 'Region',
  category: 'Category',
  quarter: 'Quarter',
  revenue: 'Revenue',
  orders: 'Orders',
}
