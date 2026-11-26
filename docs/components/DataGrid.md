# DataGrid

Tabular data with in-cell editing, row change tracking, typed row metadata, and Excel-compatible copy/paste. Most ERP lists and line-item tables use it.

**Status:** Planned  
**Priority:** P0  
**Category:** Data Grid Controls  
**ARIA pattern:** [Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)

## Import

```tsx
import { DataGrid, useGridRows } from 'enterract'
```

## Usage

```tsx
type Line = { itemId: string; qty: number; uom: string; taxable: boolean }
type LineMeta = { lineId: number; version: number } // from the server, never shown

const grid = useGridRows<Line, LineMeta>(
  serverLines.map((l) => ({ id: String(l.id), data: l.fields, meta: { lineId: l.id, version: l.version } })),
)

<DataGrid
  rows={grid.rows}
  onRowsChange={grid.setRows}
  columns={[
    { field: 'itemId', header: 'Item', editor: 'lookup', lookup: itemSource },
    { field: 'qty', header: 'Qty', editor: 'number', precision: 2 },
    { field: 'uom', header: 'UoM', editor: 'select', options: uomOptions },
    { field: 'taxable', header: 'Taxable', editor: 'checkbox' },
  ]}
/>

<Button disabled={!grid.isDirty} onClick={save}>Save</Button>
```

## Row model

Every row is a `GridRow<TData, TMeta>`. The grid is generic over both types.

```ts
type GridRow<TData, TMeta = undefined> = {
  id: string        // stable key; for new rows the grid generates a temporary id
  data: TData       // values shown in cells and edited by the user
  meta: TMeta       // your own data: not displayed, not copied, not edited by the grid
  status: RowStatus // set by the grid (see Change tracking)
  original?: TData  // snapshot taken when the row was loaded or last accepted
  changedFields?: (keyof TData)[]
  errors?: Partial<Record<keyof TData, string>>
}

type RowStatus = 'unchanged' | 'added' | 'modified' | 'deleted'
```

### Metadata (`meta`)

Use `meta` for anything a row needs that is not a column: database primary keys, concurrency version or ETag, parent document id, permissions, source system, etc.

- Fully typed through `TMeta`. No `any`.
- Passed to every column callback (`readOnly`, `options`, `validate`, `render`), so a cell can depend on it, for example `readOnly: (row) => row.meta.posted`.
- Changing `meta` (with `grid.updateMeta`) does **not** mark the row as modified.
- Never copied to the clipboard and never exported.
- Returned with each row in `getChanges()`, so the save call has its ids and versions available.

## Columns and cell editors

Each column picks an editor. Editors are the library's own form controls running in grid mode (see [Form Control Contract](../FORM-CONTROL-CONTRACT.md), rule 7), so they validate and format the same way they do in a form.

| `editor` | Control used | Cell value type | Notes |
| --- | --- | --- | --- |
| `'text'` | `TextField` | `string` | Default |
| `'number'` | `NumberField` | `number \| null` | `precision`, `min`, `max`; right-aligned |
| `'currency'` | `CurrencyField` | `string \| null` | Decimal string, never float |
| `'date'` | `DatePicker` | `string \| null` | ISO `YYYY-MM-DD` |
| `'select'` | `Select` | option key | `options` list or `(row) => options` for cascading lists |
| `'multiselect'` | `MultiSelect` | key array | |
| `'checkbox'` | `Checkbox` | `boolean` | Always shown as a checkbox; Space toggles it without entering edit mode |
| `'lookup'` | `Lookup` | entity key | Uses a lookup data source; shows the display label |
| custom | any component | any | `renderEditor={(props) => ...}` receives `value`, `onChange`, `row`, `commit`, `cancel` |

### Column definition

| Prop | Type | Description |
| --- | --- | --- |
| `field` | `keyof TData` | Which value the column edits |
| `header` | `ReactNode` | Column header |
| `editor` | see above | Editor type. Omit for display-only columns. |
| `options` | `Option[] \| (row) => Option[]` | For `select` / `multiselect` |
| `readOnly` | `boolean \| (row) => boolean` | Locks the cell (e.g. posted lines) |
| `required` | `boolean` | Empty value shows a cell error |
| `validate` | `(value, row) => string \| undefined` | Returns an error message |
| `format` | `(value, row) => string` | Display text. Also used for copy when `copyAs: 'display'` |
| `parse` | `(text, row) => value` | Converts pasted text. Defaults per editor type (see Clipboard). |
| `copyAs` | `'value' \| 'display'` | What goes to the clipboard. Default: `'value'` for numbers, dates and checkboxes, `'display'` for selects and lookups |
| `width`, `minWidth`, `frozen` | | Layout |

## Change tracking

The grid compares every edit with the row's `original` snapshot and keeps `status` and `changedFields` up to date.

| Action | Resulting status |
| --- | --- |
| Edit a cell on an unchanged row | `modified`, the field is added to `changedFields` |
| Edit the value back to the original | `unchanged` again (comparison by value, not "was touched") |
| Add a row | `added` |
| Edit an added row | stays `added` |
| Delete an unchanged or modified row | `deleted` (row stays hidden until changes are accepted, so it can be restored) |
| Delete an added row | removed completely; nothing to send |

**UI:** a narrow status column on the left shows a marker for added, modified and deleted rows, and changed cells get a `data-changed` attribute so you can style them. Hovering a changed cell shows the original value.

### `useGridRows` API

| Member | Description |
| --- | --- |
| `rows` / `setRows` | Pass to `DataGrid` |
| `isDirty` | `true` if any row is added, modified or deleted |
| `hasErrors` | `true` if any cell has a validation error |
| `getChanges()` | Returns `{ added, modified, deleted }` (see below) |
| `acceptChanges(ids?)` | After a successful save: makes current values the new `original`, sets rows to `unchanged`, drops deleted rows. Pass ids to accept only the rows the server confirmed. |
| `rejectChanges(ids?)` | Reverts rows to `original` |
| `revertRow(id)` / `revertCell(id, field)` | Undo a single row or cell |
| `updateMeta(id, meta)` | Replace a row's meta, e.g. with the new version or id returned by the server |
| `addRow(data?, meta?)`, `deleteRows(ids)` | Programmatic changes; tracked like user edits |

### `getChanges()` result

```ts
type GridChanges<TData, TMeta> = {
  added:    { id: string; data: TData; meta: TMeta }[]
  modified: { id: string; data: TData; meta: TMeta; original: TData; changedFields: (keyof TData)[] }[]
  deleted:  { id: string; original: TData; meta: TMeta }[]
}
```

### Saving example

```ts
async function save() {
  if (grid.hasErrors) return
  const { added, modified, deleted } = grid.getChanges()

  const res = await api.post('/orders/42/lines/batch', {
    create: added.map((r) => r.data),
    update: modified.map((r) => ({
      id: r.meta.lineId,
      version: r.meta.version,
      // send only the changed fields
      changes: Object.fromEntries(r.changedFields.map((f) => [f, r.data[f]])),
    })),
    delete: deleted.map((r) => ({ id: r.meta.lineId, version: r.meta.version })),
  })

  // put server ids/versions on the new rows, then reset tracking
  res.created.forEach((c, i) => grid.updateMeta(added[i].id, { lineId: c.id, version: c.version }))
  grid.acceptChanges()
}
```

If only some rows save successfully, call `acceptChanges(savedIds)`. The failed rows stay flagged so the user can fix them and retry.

## Selection (Excel style)

Cells select the way they do in Excel. The same behavior is shared by `LineItemGrid`, `SpreadsheetGrid`, `TreeGrid` (and `BomEditor`), `PivotGrid` (read-only: select and copy) and `MatrixEditor`.

- **Mouse:** click a cell, drag across cells, or Shift+click to extend from the active cell.
- **Keyboard:** Shift+arrows extend; Ctrl+arrows jump to the first or last row or column; Shift+Space selects the row; Ctrl+Space selects the column; Ctrl+A selects all.
- The selection has a solid border, and the column headers it covers are highlighted.
- With two or more cells selected, the status bar shows **Average**, **Count** (non-empty cells) and **Sum**, like Excel's status bar. Numbers and decimal strings (currency) are summed.
- **Fill:** drag the small square at the bottom-right of the selection (the fill handle) down, up, left or right. **Ctrl+D** fills down from the first selected row (or from the cell above when one row is selected), and **Ctrl+R** fills right. The source pattern repeats; two or more evenly spaced numbers continue as a series (`1, 2` → `3, 4, 5`). Locked cells are skipped, and the whole fill is one undo step.
- **Delete** / **Backspace** clears the selected cells (non-required, editable cells only).

## Clipboard (Excel compatible)

Copy and paste use the system clipboard, so they work with Excel, Google Sheets and LibreOffice in both directions.

### Copy (grid to Excel)

- **Ctrl+C** copies the selected cells, rows or columns. **Ctrl+Shift+C** also copies the column headers.
- The copied range keeps a dashed "marching ants" border until you press **Escape** or copy something else.
- **Ctrl+X** copies the selection and clears it (one undo step). Locked and required cells are copied but not cleared.
- The clipboard gets two formats:
  - `text/plain`: tab-separated values, one line per row (what Excel reads by default)
  - `text/html`: a `<table>`, so programs that prefer HTML keep the cell structure
- Values are written so Excel recognises their types:

| Editor | Copied as |
| --- | --- |
| number, currency | Plain number with `.` decimal separator and no thousand separators (`1234.5`) |
| date | `YYYY-MM-DD` |
| checkbox | `TRUE` / `FALSE` |
| select, lookup | Display label (or key with `copyAs: 'value'`) |
| text | As is. Cells containing a tab, newline or `"` are quoted using Excel's rules. |

- `meta` and hidden columns are never copied.

### Paste (Excel to grid)

- **Ctrl+V** pastes starting at the top-left of the selection, filling right and down. Afterwards the pasted block is selected.
- If one value is copied and several cells are selected, the value fills all selected cells. If the selection is an exact multiple of the copied block (for example two values pasted into six rows), the block repeats to fill it, as in Excel.
- Each pasted text value goes through the column's `parse`. The defaults are:

| Editor | Accepts |
| --- | --- |
| number, currency | `1234.5`, `1,234.50`, `1.234,50` (based on the grid's locale), `(12)` as negative |
| date | ISO, the locale's short date format, and Excel serial numbers |
| checkbox | `TRUE/FALSE`, `1/0`, `yes/no`, `y/n`, `x`/empty (case-insensitive) |
| select, lookup | Option label or key (case-insensitive). No match = cell error. |

- Read-only cells and columns are skipped.
- Values that fail parsing are not written. The paste continues, and a summary lists skipped cells (for example: "3 cells could not be pasted").
- Pasting past the last row adds new rows when `allowAddOnPaste` is set (status `added`). Otherwise, the extra rows are ignored.
- Pasted cells go through change tracking like typed edits.
- One paste is a single undo step (**Ctrl+Z**).

### Export

For whole-grid output (not only the selection), use the `Export` action: CSV is built in, and `.xlsx` is available through an optional exporter so the core package keeps no heavy dependency.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `GridRow<TData, TMeta>[]` | required | |
| `onRowsChange` | `(rows) => void` | | Required when editable |
| `columns` | `GridColumn<TData, TMeta>[]` | required | |
| `editable` | `boolean` | `true` if any column has an editor | Grid-level lock, e.g. for posted documents |
| `allowAdd` / `allowDelete` | `boolean` | `false` | Shows add-row and delete controls |
| `allowAddOnPaste` | `boolean` | `false` | |
| `showStatusColumn` | `boolean` | `true` when editable | Shows the change marker column |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Row selection with checkboxes |
| `locale` | `string` | app locale | Number and date parsing and formatting |
| `onCellError` | `(id, field, message) => void` | | |
| `size` | `'sm' \| 'md'` | `'sm'` | Grids default to compact |

## Keyboard

| Key | Action |
| --- | --- |
| Arrow keys | Move the active cell |
| Ctrl+Arrow | Jump to the first / last row or column |
| Enter / F2 | Start editing; Enter again commits and moves down |
| Typing a character | Start editing, replacing the value |
| Escape | Cancel the edit |
| Tab / Shift+Tab | Commit and move right / left |
| Space | Toggle a checkbox cell; open a select cell |
| Shift+Arrow / Shift+click / drag | Extend the selection |
| Shift+Space / Ctrl+Space | Select the row / the column |
| Ctrl+A | Select all cells |
| Ctrl+C / Ctrl+Shift+C | Copy / copy with headers |
| Ctrl+X | Cut (copy, then clear) |
| Ctrl+V | Paste |
| Ctrl+D / Ctrl+R | Fill down / fill right |
| Escape | Remove the copy marker |
| Delete / Backspace | Clear the selected cells (non-required columns only) |
| Ctrl+Z / Ctrl+Y | Undo / redo |
| Ctrl+Enter | Add a row below (when `allowAdd`) |

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-data-grid` | Root |
| `.erp-data-grid__row[data-status="added\|modified\|deleted"]` | Row change state |
| `.erp-data-grid__cell[data-changed]` | Edited cell |
| `[data-in-range]`, `[data-range-edge="t r b l"]` | Selected cells and the outer edges of the selection |
| `[data-dash="copy\|fill"][data-dash-edge]` | Copied range (marching ants) / fill preview |
| `.erp-fill-handle` | Fill handle at the bottom-right of the selection |
| `.erp-data-grid__header[data-range-col]` | Header of a selected column |
| `.erp-range-summary` | Average / Count / Sum in the status bar |
| `.erp-data-grid__cell[aria-invalid="true"]` | Cell with a validation error |
| `.erp-data-grid__cell[aria-readonly="true"]` | Locked cell |

## Storybook

The grid must follow [Storybook compliance](../CONVENTIONS.md#storybook-compliance). Because it is generic, stateful and clipboard-driven, it has these extra rules.

### Files

```text
src/components/DataGrid/
  DataGrid.stories.tsx
  DataGrid.fixtures.ts   # Line, LineMeta, columns, rows, fake lookup source
```

### Typing a generic component

`Meta<typeof DataGrid>` loses the row types. Pin them with an instantiation expression so `args`, `columns` and `meta` are fully typed:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DataGrid, useGridRows } from './DataGrid'
import { lineColumns, lineRows, type Line, type LineMeta } from './DataGrid.fixtures'

const meta = {
  title: 'Components/DataGrid',
  component: DataGrid<Line, LineMeta>,
  args: {
    rows: lineRows,
    columns: lineColumns,
    onRowsChange: fn(),
    editable: true,
    size: 'sm',
  },
  argTypes: {
    rows: { control: false },
    columns: { control: false },
    selectionMode: { control: 'inline-radio', options: ['none', 'single', 'multiple'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    locale: { control: 'select', options: ['en-US', 'de-DE', 'id-ID'] },
  },
  render: (args) => <TrackedGrid {...args} />,
} satisfies Meta<typeof DataGrid<Line, LineMeta>>

export default meta
type Story = StoryObj<typeof meta>
```

### Stateful render with a change inspector

Stories render through a small `TrackedGrid` wrapper that holds state with `useGridRows`, calls the `onRowsChange` arg (so the Actions panel logs edits), and shows the result of `getChanges()` as JSON under the grid. Reviewers can then see the row flags, changed fields and `meta` update live, which is the main thing to check in this component.

```tsx
function TrackedGrid(args: DataGridProps<Line, LineMeta>) {
  const grid = useGridRows(args.rows)
  return (
    <>
      <DataGrid
        {...args}
        rows={grid.rows}
        onRowsChange={(rows) => { grid.setRows(rows); args.onRowsChange?.(rows) }}
      />
      <button onClick={() => grid.acceptChanges()}>Accept changes</button>
      <button onClick={() => grid.rejectChanges()}>Reject changes</button>
      <pre aria-label="changes">{JSON.stringify(grid.getChanges(), null, 2)}</pre>
    </>
  )
}
```

The `Accept changes` / `Reject changes` buttons simulate a save in the story. Stories never call a real API.

### Fixtures

- Fixed ids, dates and versions. No random or time-based values.
- At least one row with `meta.posted = true` (locked row), one row with a validation error, and enough rows (50+) for a `ManyRows` story that shows scrolling and frozen columns.
- The lookup column uses an in-memory fake data source with a small fixed delay, so loading states are visible but deterministic.

### Required stories

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | Editable grid with every editor type | |
| `ReadOnly` | `editable={false}` | Typing in a cell does nothing |
| `CellEditors` | Text, number, currency, date, select, checkbox and lookup columns | Edits one cell of each type and checks the value |
| `CheckboxCells` | Boolean column | Space toggles; row becomes `modified` |
| `CascadingSelect` | `options: (row) => ...` | Changing column A changes the options in column B |
| `ChangeTracking` | Inspector visible | Edit a cell: status `modified`, field listed. Edit it back: status `unchanged` |
| `AddAndDelete` | `allowAdd`, `allowDelete` | Add row is `added`; delete unchanged row is `deleted`; delete added row removes it |
| `RowMetadata` | `meta` used for `readOnly: (row) => row.meta.posted` | Posted row can't be edited; `meta` appears in `getChanges()` |
| `Validation` | Required and `validate` columns | Clearing a required cell shows the error and sets `aria-invalid` |
| `CopyToExcel` | Selection copy | Copy a range; clipboard `text/plain` is the expected TSV |
| `PasteFromExcel` | Paste with `allowAddOnPaste` | Paste TSV with a bad value: valid cells written, bad cell skipped and reported, new rows `added` |
| `RangeSelectAndFill` | Excel-style selection | Drag-select three Note cells, Count in the status bar, Ctrl+D fills down |
| `Locale` | `locale="de-DE"` | Pasting `1.234,50` gives `1234.5` |
| `Selection` | `selectionMode="multiple"` | Bulk select checkbox selects all rows |
| `Compact` | `size="sm"` vs `md` | |
| `ManyRows` | 50+ rows, frozen first column | |
| `Empty` | No rows | Empty-state message is shown |

### Testing the clipboard in `play`

Browsers block real clipboard access in automated runs, so `play` functions fire the events directly instead of using the system clipboard:

```tsx
export const PasteFromExcel: Story = {
  args: { allowAddOnPaste: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cell = canvas.getByRole('gridcell', { name: /qty, row 1/i })
    await userEvent.click(cell)

    const data = new DataTransfer()
    data.setData('text/plain', '5\tPCS\tTRUE\nabc\tBOX\tFALSE')
    cell.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))

    await expect(canvas.getByText(/1 cell could not be pasted/i)).toBeVisible()
  },
}
```

For copy, the grid writes through `event.clipboardData` in its `copy` handler. The `play` function dispatches a `copy` event with its own `DataTransfer` and reads `getData('text/plain')` and `getData('text/html')` back from it.

### Autodocs

- JSDoc on `DataGrid`, `GridRow`, `GridColumn` and `useGridRows`, so the generated docs page explains the row model and change tracking.
- react-docgen does not expand generic types well, so the `GridColumn` and `GridRow` shapes are also written out in the component's JSDoc.

## ERP notes

- Keep `meta.version` (or an ETag) on every row and send it on update and delete so the server can reject edits based on stale data.
- Locking lines after posting is a row rule: `readOnly: (row) => row.meta.posted`. Don't remove the column.
- Show the grid's `isDirty` in the page's unsaved-changes prompt.

## Related

- `LineItemGrid` (preset with totals footer), `TreeGrid`, `SpreadsheetGrid`, `Lookup`, `Select`, `Checkbox`
