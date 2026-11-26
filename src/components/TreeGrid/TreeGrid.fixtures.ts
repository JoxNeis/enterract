import type { TreeGridColumn, TreeGridRow } from './TreeGrid'

export interface CostLine {
  name: string
  budget: number | null
  actual: number | null
}

/** Project cost breakdown: parents roll up their children. */
export const costRows: TreeGridRow<CostLine>[] = [
  {
    id: 'p',
    data: { name: 'New plant Cikarang', budget: null, actual: null },
    children: [
      {
        id: 'p1',
        data: { name: 'Building', budget: null, actual: null },
        children: [
          { id: 'p11', data: { name: 'Foundation', budget: 120000, actual: 118400 } },
          { id: 'p12', data: { name: 'Steel structure', budget: 340000, actual: 352900 } },
          { id: 'p13', data: { name: 'Roof', budget: 90000, actual: 61000 } },
        ],
      },
      {
        id: 'p2',
        data: { name: 'Equipment', budget: null, actual: null },
        children: [
          { id: 'p21', data: { name: 'Press line', budget: 610000, actual: 590000 } },
          { id: 'p22', data: { name: 'Conveyors', budget: 85000, actual: 0 } },
        ],
      },
      { id: 'p3', data: { name: 'Permits', budget: 15000, actual: 14200 } },
      { id: 'p4', data: { name: 'IT and network', budget: null, actual: null }, hasChildren: true },
    ],
  },
]

export const costColumns: TreeGridColumn<CostLine>[] = [
  { field: 'name', header: 'Cost item', editor: 'text' },
  { field: 'budget', header: 'Budget', type: 'number', editor: 'number', precision: 0, rollup: 'sum', width: 130 },
  { field: 'actual', header: 'Actual', type: 'number', editor: 'number', precision: 0, rollup: 'sum', width: 130 },
]

export function loadCostChildren(row: TreeGridRow<CostLine>): Promise<TreeGridRow<CostLine>[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        row.id === 'p4'
          ? [
              { id: 'p41', data: { name: 'Network cabling', budget: 22000, actual: 9000 } },
              { id: 'p42', data: { name: 'Servers', budget: 48000, actual: 0 } },
            ]
          : []
      )
    }, 200)
  })
}

/** Immutable update of one cell in a tree. */
export function updateTree<T>(rows: readonly TreeGridRow<T>[], id: string, field: keyof T, value: unknown): TreeGridRow<T>[] {
  return rows.map((r) =>
    r.id === id
      ? { ...r, data: { ...r.data, [field]: value } }
      : r.children
        ? { ...r, children: updateTree(r.children, id, field, value) }
        : r
  )
}
