import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { useGridRows, type GridColumn, type GridRow } from '../DataGrid'
import { itemSource } from '../DataGrid/DataGrid.fixtures'
import { LineItemGrid, type LineItemGridProps } from './LineItemGrid'

interface InvoiceLine {
  itemId: string | null
  qty: number | null
  price: string | null
  discount: number | null
  taxable: boolean
}

const columns: GridColumn<InvoiceLine>[] = [
  { field: 'itemId', header: 'Item', editor: 'lookup', lookup: itemSource as GridColumn<InvoiceLine>['lookup'], width: 220, required: true },
  { field: 'qty', header: 'Qty', editor: 'number', precision: 2, width: 80, required: true, aggregate: 'sum' },
  { field: 'price', header: 'Unit price', editor: 'currency', width: 120, required: true },
  { field: 'discount', header: 'Disc %', editor: 'number', precision: 1, width: 80, min: 0, max: 100 },
  { field: 'taxable', header: 'Taxable', editor: 'checkbox', width: 80 },
]

const rows: GridRow<InvoiceLine>[] = [
  { id: '1', data: { itemId: 'BOLT-M6', qty: 500, price: '0.12', discount: null, taxable: true }, meta: undefined, status: 'unchanged' },
  { id: '2', data: { itemId: 'PIPE-20', qty: 12.5, price: '4.80', discount: 5, taxable: true }, meta: undefined, status: 'unchanged' },
  { id: '3', data: { itemId: 'GLOVE-L', qty: 4, price: '22.50', discount: null, taxable: false }, meta: undefined, status: 'unchanged' },
].map((r) => ({ ...r, status: 'unchanged' as const, original: { ...r.data } }))

function Tracked(args: LineItemGridProps<InvoiceLine>) {
  const grid = useGridRows(args.rows)
  return (
    <LineItemGrid<InvoiceLine>
      {...args}
      rows={grid.rows}
      onRowsChange={(next) => {
        grid.setRows(next)
        args.onRowsChange?.(next)
      }}
    />
  )
}

const meta = {
  title: 'Components/LineItemGrid',
  component: LineItemGrid<InvoiceLine>,
  args: {
    'aria-label': 'Invoice lines',
    rows,
    columns,
    quantityField: 'qty',
    priceField: 'price',
    discountField: 'discount',
    taxableField: 'taxable',
    taxRate: '0.11',
    currency: 'USD',
    newRow: () => ({ itemId: null, qty: 1, price: null, discount: null, taxable: true }),
    onRowsChange: fn(),
    showTotals: true,
    editable: true,
  },
  argTypes: {
    rows: { control: false },
    columns: { control: false },
    newRow: { control: false },
    currency: { control: 'select', options: ['USD', 'EUR', 'IDR', 'JPY'] },
    taxRate: { control: 'select', options: ['0', '0.07', '0.11', '0.19'] },
  },
  render: (args) => <Tracked {...args} />,
} satisfies Meta<typeof LineItemGrid<InvoiceLine>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const totals = canvas.getByLabelText('Totals')
    // 60.00 + 57.00 (5% off) + 90.00 (not taxed) = 207.00; tax 11% of 117.00 = 12.87
    await expect(totals).toHaveTextContent('$219.87')
    await userEvent.click(canvas.getByRole('gridcell', { name: /^qty, row 1\b/i }))
    await userEvent.keyboard('1000{Enter}')
    await expect(canvas.getByRole('gridcell', { name: /^amount, row 1\b/i })).toHaveTextContent('$120.00')
  },
}

export const Euro: Story = { args: { currency: 'EUR', taxRate: '0.19', locale: 'de-DE', taxLabel: 'MwSt. (19 %)' } }

export const Empty: Story = { args: { rows: [] } }

export const Disabled: Story = { args: { editable: false, allowAdd: false, allowDelete: false } }
