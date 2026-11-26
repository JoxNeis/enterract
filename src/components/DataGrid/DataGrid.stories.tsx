import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { DataGrid, type DataGridProps } from './DataGrid'
import {
  lineColumns,
  lineRows,
  manyLineRows,
  newLine,
  newLineMeta,
  productColumns,
  productRows,
  type Line,
  type LineMeta,
  type Product,
} from './DataGrid.fixtures'
import { useGridRows } from './useGridRows'

/** Holds state with useGridRows and shows getChanges() live under the grid. */
function TrackedGrid(args: DataGridProps<Line, LineMeta>) {
  const grid = useGridRows(args.rows, { columns: args.columns })
  return (
    <>
      <DataGrid
        {...args}
        rows={grid.rows}
        onRowsChange={(rows) => {
          grid.setRows(rows)
          args.onRowsChange?.(rows)
        }}
      />
      <div style={{ display: 'flex', gap: 8, margin: '8px 0', alignItems: 'center', fontSize: 12 }}>
        <button
          onClick={() => {
            grid.acceptChanges()
          }}
        >
          Accept changes
        </button>
        <button
          onClick={() => {
            grid.rejectChanges()
          }}
        >
          Reject changes
        </button>
        <span>
          isDirty: <b>{String(grid.isDirty)}</b> · hasErrors: <b>{String(grid.hasErrors)}</b>
        </span>
      </div>
      <pre
        aria-label='changes'
        style={{ fontSize: 11, maxHeight: 260, overflow: 'auto', background: 'var(--erp-color-bg-subtle)', padding: 8 }}
      >
        {JSON.stringify(grid.getChanges(), null, 2)}
      </pre>
    </>
  )
}

const meta = {
  title: 'Components/DataGrid',
  component: DataGrid<Line, LineMeta>,
  args: {
    'aria-label': 'Order lines',
    rows: lineRows,
    columns: lineColumns,
    onRowsChange: fn(),
    onCellError: fn(),
    onSelectionChange: fn(),
    newRow: newLine,
    newRowMeta: newLineMeta,
    editable: true,
    allowAdd: false,
    allowDelete: false,
    allowAddOnPaste: false,
    selectionMode: 'none',
    size: 'sm',
  },
  argTypes: {
    rows: { control: false },
    columns: { control: false },
    newRow: { control: false },
    newRowMeta: { control: false },
    renderDetail: { control: false },
    toolbar: { control: false },
    sort: { control: false },
    selectionMode: { control: 'inline-radio', options: ['none', 'single', 'multiple'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID'] },
    groupBy: { control: 'select', options: [undefined, 'uom', 'taxable', 'deliveryDate'] },
  },
  render: (args) => <TrackedGrid {...args} />,
} satisfies Meta<typeof DataGrid<Line, LineMeta>>

export default meta
type Story = StoryObj<typeof meta>

const cellIn = (root: HTMLElement, name: RegExp) => within(root).getByRole('gridcell', { name })
const changesIn = (root: HTMLElement) =>
  JSON.parse(within(root).getByLabelText('changes').textContent) as {
    added: unknown[]
    modified: { changedFields: string[]; meta: LineMeta }[]
    deleted: { meta: LineMeta }[]
  }

/** Editable grid with every editor type. Click a cell and type, or press Enter/F2. */
export const Default: Story = { args: { allowAdd: true, allowDelete: true, allowAddOnPaste: true } }

export const ReadOnly: Story = {
  args: { editable: false },
  play: async ({ canvasElement }) => {
    await userEvent.click(cellIn(canvasElement, /^note, row 1\b/i))
    await userEvent.keyboard('abc{Enter}')
    await expect(changesIn(canvasElement).modified).toHaveLength(0)
  },
}

export const CellEditors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // number
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('7{Enter}')
    await expect(cellIn(canvasElement, /^qty, row 1\b/i)).toHaveTextContent('7.00')
    // text
    await userEvent.click(cellIn(canvasElement, /^note, row 1\b/i))
    await userEvent.keyboard('Urgent{Enter}')
    await expect(cellIn(canvasElement, /^note, row 1\b/i)).toHaveTextContent('Urgent')
    // currency
    await userEvent.click(cellIn(canvasElement, /^unit price, row 2\b/i))
    await userEvent.keyboard('9{Enter}')
    await expect(cellIn(canvasElement, /^unit price, row 2\b/i)).toHaveTextContent('$9.00')
    // date
    await userEvent.click(cellIn(canvasElement, /^delivery, row 2\b/i))
    await userEvent.keyboard('{F2}{Control>}a{/Control}04/01/2026{Enter}')
    await expect(cellIn(canvasElement, /^delivery, row 2\b/i)).toHaveTextContent('04/01/2026')
    // checkbox
    await userEvent.click(cellIn(canvasElement, /^taxable, row 2\b/i))
    await userEvent.keyboard(' ')
    await expect(cellIn(canvasElement, /^taxable, row 2\b/i)).toHaveAccessibleName(/: No$/)
    await expect(canvas.getByLabelText('changes')).toHaveTextContent('"qty"')
  },
}

export const CheckboxCells: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(cellIn(canvasElement, /^taxable, row 1\b/i))
    await userEvent.keyboard(' ')
    await expect(changesIn(canvasElement).modified[0]?.changedFields).toEqual(['taxable'])
  },
}

export const CascadingSelect: Story = {
  render: () => <CascadingDemo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('gridcell', { name: /^category, row 1\b/i }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() =>
      expect(within(canvasElement).getByRole('gridcell', { name: /^subcategory, row 1\b/i })).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    )
  },
}

function CascadingDemo() {
  const grid = useGridRows<Product>(productRows)
  return (
    <DataGrid<Product>
      aria-label='Products'
      rows={grid.rows}
      onRowsChange={grid.setRows}
      columns={productColumns}
    />
  )
}

export const ChangeTracking: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('5{Enter}')
    await expect(changesIn(canvasElement).modified[0]?.changedFields).toEqual(['qty'])
    await expect(cellIn(canvasElement, /^qty, row 1\b/i)).toHaveAttribute('data-changed', 'true')
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('{F2}{Control>}a{/Control}100{Enter}')
    await expect(changesIn(canvasElement).modified).toHaveLength(0)
  },
}

export const AddAndDelete: Story = {
  args: { allowAdd: true, allowDelete: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add row' }))
    await waitFor(() => expect(changesIn(canvasElement).added).toHaveLength(1))
    await userEvent.click(cellIn(canvasElement, /^note, row 2\b/i))
    await userEvent.click(canvas.getByRole('button', { name: 'Delete row' }))
    await waitFor(() => expect(changesIn(canvasElement).deleted).toHaveLength(1))
    // Delete the added row: it disappears and is not reported.
    await userEvent.click(cellIn(canvasElement, /^note, row 2\b/i))
    await userEvent.click(canvas.getByRole('button', { name: 'Delete row' }))
    await waitFor(() => expect(changesIn(canvasElement).added).toHaveLength(0))
  },
}

export const RowMetadata: Story = {
  play: async ({ canvasElement }) => {
    const locked = cellIn(canvasElement, /^qty, row 3\b/i)
    await expect(locked).toHaveAttribute('aria-readonly', 'true')
    await userEvent.click(locked)
    await userEvent.keyboard('9{Enter}')
    await expect(changesIn(canvasElement).modified).toHaveLength(0)
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('9{Enter}')
    await expect(changesIn(canvasElement).modified[0]?.meta).toEqual({ lineId: 101, version: 3, posted: false })
  },
}

export const Validation: Story = {
  play: async ({ canvasElement }) => {
    await expect(cellIn(canvasElement, /^qty, row 4\b/i)).toHaveAttribute('aria-invalid', 'true')
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('{Delete}')
    await userEvent.click(cellIn(canvasElement, /^item, row 2\b/i))
    await userEvent.keyboard('{Delete}')
    await expect(cellIn(canvasElement, /^item, row 2\b/i)).not.toHaveAttribute('aria-invalid')
    await userEvent.click(cellIn(canvasElement, /^qty, row 2\b/i))
    await userEvent.keyboard('{F2}{Control>}a{/Control}{Backspace}{Enter}')
    await expect(cellIn(canvasElement, /^qty, row 2\b/i)).toHaveAttribute('aria-invalid', 'true')
  },
}

export const CopyToExcel: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(cellIn(canvasElement, /^qty, row 1\b/i))
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowDown}{/Shift}')
    const data = new DataTransfer()
    cellIn(canvasElement, /^taxable, row 2\b/i).dispatchEvent(
      new ClipboardEvent('copy', { clipboardData: data, bubbles: true, cancelable: true })
    )
    await expect(data.getData('text/plain')).toBe('100\tPieces\tTRUE\n100\tPieces\tTRUE')
    await expect(data.getData('text/html')).toContain('<table>')
  },
}

export const PasteFromExcel: Story = {
  args: { allowAddOnPaste: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cell = cellIn(canvasElement, /^qty, row 4\b/i)
    await userEvent.click(cell)

    const data = new DataTransfer()
    data.setData('text/plain', '5\tPCS\tTRUE\nabc\tBOX\tFALSE\n3\tM\tx')
    cell.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))

    await expect(await canvas.findByText(/1 cell could not be pasted/i)).toBeVisible()
    await waitFor(() => expect(changesIn(canvasElement).added).toHaveLength(1))
  },
}

/**
 * Select like Excel: drag across cells (or Shift+click, Shift+arrows, Shift+Space for a row,
 * Ctrl+Space for a column). The status bar shows Average, Count and Sum. Drag the square at the
 * bottom-right of the selection, or press Ctrl+D / Ctrl+R, to fill; two or more numbers continue
 * as a series. Ctrl+X cuts, Delete clears, Escape removes the dashed copy marker.
 */
export const RangeSelectAndFill: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const from = cellIn(canvasElement, /^note, row 3\b/i)
    const to = cellIn(canvasElement, /^note, row 5\b/i)
    await userEvent.pointer([{ keys: '[MouseLeft>]', target: from }, { target: to }, { keys: '[/MouseLeft]' }])
    await waitFor(() => expect(cellIn(canvasElement, /^note, row 5\b/i)).toHaveAttribute('aria-selected', 'true'))
    await expect(canvas.getByText('Count: 2')).toBeVisible()
    await userEvent.keyboard('{Control>}d{/Control}')
    await expect(await canvas.findByText('Filled 2 cells')).toBeVisible()
    await expect(cellIn(canvasElement, /^note, row 5\b/i)).toHaveTextContent('Cut to 2.5 m')
  },
}

export const Locale: Story = {
  args: { locale: 'de-DE' },
  play: async ({ canvasElement }) => {
    const cell = cellIn(canvasElement, /^qty, row 1\b/i)
    await userEvent.click(cell)
    const data = new DataTransfer()
    data.setData('text/plain', '1.234,50')
    cell.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
    await waitFor(() => expect(cellIn(canvasElement, /^qty, row 1\b/i)).toHaveTextContent('1.234,50'))
  },
}

export const Selection: Story = {
  args: { selectionMode: 'multiple', allowDelete: true },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('checkbox', { name: 'Select all rows on this page' }))
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith(['101', '102', '103', '104', '105'])
  },
}

export const Compact: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <TrackedGrid
        {...args}
        size='sm'
      />
      <TrackedGrid
        {...args}
        size='md'
        aria-label='Order lines (md)'
      />
    </div>
  ),
}

export const ManyRows: Story = {
  args: { rows: manyLineRows, height: 360 },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
}

export const Paging: Story = { args: { rows: manyLineRows, pageSize: 15, selectionMode: 'multiple' } }

export const Grouped: Story = { args: { rows: manyLineRows, groupBy: 'uom', height: 420 } }

export const MasterDetail: Story = {
  args: {
    renderDetail: (row) => (
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', margin: 0 }}>
        <dt>Line id</dt>
        <dd style={{ margin: 0 }}>{row.meta.lineId}</dd>
        <dt>Version</dt>
        <dd style={{ margin: 0 }}>{row.meta.version}</dd>
        <dt>Posted</dt>
        <dd style={{ margin: 0 }}>{row.meta.posted ? 'Yes' : 'No'}</dd>
      </dl>
    ),
  },
  play: async ({ canvasElement }) => {
    const [toggle] = within(canvasElement).getAllByRole('button', { name: 'Expand details' })
    if (toggle) await userEvent.click(toggle)
    await expect(within(canvasElement).getByText('Line id')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { rows: [], emptyText: 'No lines yet. Use Add row or paste from Excel.', allowAdd: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/no lines yet/i)).toBeVisible()
  },
}

export const Disabled: Story = { args: { editable: false, selectionMode: 'none' } }
