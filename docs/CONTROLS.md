# Control Catalog

The full list of controls planned for **enterract**. This file tracks what exists and what to build next.

**Priority**
- **P0**: Core. Nearly every ERP screen uses it (the "Top 20").
- **P1**: Common. Needed for most real modules.
- **P2**: Advanced or specialized.

**Status:** Planned, In progress, or Done (Done means it has code, tests, stories and a doc)

> **Naming:** the component name is also the folder name under `src/components/` and the doc name under `docs/components/`.
> Items marked *(feature)* are not separate components. They are props or modes of the parent control.
> Items marked *(variant)* are presets built from another component.

---

## 1. Text Inputs

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Single-line text box | `TextField` | P0 | Planned | Base for most text controls |
| Multi-line text area | `TextArea` | P0 | Planned | Auto-grow, character counter |
| Rich text editor | `RichTextEditor` | P2 | Done | Built-in minimal editor (no runtime deps); props allow swapping in an engine later |
| Masked text input | `MaskedField` | P1 | Planned | Phone, tax ID, IBAN, postal code |
| Password field | `PasswordField` | P1 | Planned | Show/hide toggle |
| Search input | `SearchField` | P0 | Planned | Debounced, clear button |
| Read-only text field | `TextField` *(feature)* | P0 | Planned | `readOnly` prop; see [FORM-CONTROL-CONTRACT](FORM-CONTROL-CONTRACT.md) |
| Auto-complete text field | `AutoComplete` | P0 | Planned | Free text plus suggestions |
| Token/tag input | `TagInput` | P1 | Planned | |

## 2. Numeric Inputs

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Integer field | `NumberField` *(variant)* | P0 | Planned | `precision={0}` |
| Decimal field | `NumberField` | P0 | Planned | Base numeric control; locale-aware parsing |
| Percentage field | `PercentField` | P1 | Planned | Stores 0.15 and shows 15% (document which form you store) |
| Currency field | `CurrencyField` | P0 | Planned | Currency code prop; never use floats for money (see notes below) |
| Quantity field | `QuantityField` | P1 | Planned | Unit of measure suffix/selector |
| Spinner / Stepper input | `NumberField` *(feature)* | P1 | Planned | `showStepper`, `step` |
| Calculator field | `CalculatorField` | P2 | Planned | Expression input (`=12*3.5`) |

## 3. Date & Time Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Date picker | `DatePicker` | P0 | Planned | |
| Date range picker | `DateRangePicker` | P1 | Planned | Presets: this month, last quarter… |
| Time picker | `TimePicker` | P1 | Planned | |
| Date-time picker | `DateTimePicker` | P1 | Planned | Time zone handling must be explicit |
| Fiscal period selector | `FiscalPeriodPicker` | P1 | Planned | Fiscal calendar comes from config, not the Gregorian calendar |
| Month picker | `MonthPicker` | P1 | Planned | |
| Year picker | `YearPicker` | P2 | Planned | |
| Calendar control | `Calendar` | P1 | Planned | Shared by all pickers above |

## 4. Selection Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Dropdown (single select) | `Select` | P0 | Planned | |
| Dropdown (multi-select) | `MultiSelect` | P0 | Planned | |
| Combo box | `ComboBox` | P1 | Planned | Select plus typing |
| Lookup field | `Lookup` | P0 | Planned | Base for the ERP lookups in §5 |
| Searchable lookup | `Lookup` *(feature)* | P0 | Planned | Server-side search, paging |
| Radio button group | `RadioGroup` | P0 | Planned | |
| Checkbox | `Checkbox` | P0 | Planned | Includes the indeterminate state |
| Checkbox group | `CheckboxGroup` | P1 | Planned | |
| Toggle switch | `Switch` | P1 | Planned | |
| Dual-list selector | `DualListSelector` | P2 | Planned | Available ↔ Selected |
| Tree selector | `TreeSelect` | P1 | Planned | |
| Hierarchical selector | `TreeSelect` *(feature)* | P1 | Planned | Lazy-loaded children |
| Cascading dropdowns | `CascadingSelect` | P2 | Planned | Country → State → City |

## 5. ERP-Specific Lookup Controls

These are **presets of `Lookup`**. Each one sets columns, display format and a data source for one master-data entity. Build `Lookup` first, then each preset should take only a few lines.

| Control | Component | Priority | Status | Typical display |
| --- | --- | --- | --- | --- |
| Customer selector | `CustomerLookup` | P1 | Planned | Code, Name, City |
| Vendor selector | `VendorLookup` | P1 | Planned | Code, Name |
| Item/Product selector | `ItemLookup` | P1 | Planned | SKU, Description, UoM, On-hand |
| Warehouse selector | `WarehouseLookup` | P1 | Planned | Code, Name |
| Employee selector | `EmployeeLookup` | P1 | Planned | Avatar, Name, Dept |
| Account selector | `AccountLookup` | P1 | Planned | Account no., Name, Type |
| Cost center selector | `CostCenterLookup` | P2 | Planned | |
| Project selector | `ProjectLookup` | P2 | Planned | |
| Department selector | `DepartmentLookup` | P2 | Planned | |
| Location selector | `LocationLookup` | P2 | Planned | |
| Business partner selector | `BusinessPartnerLookup` | P2 | Planned | Customer + vendor union |

## 6. Data Grid Controls

One `DataGrid` component. Most rows below are **modes or features** of it, not separate components. Full spec: [components/DataGrid.md](components/DataGrid.md).

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Read-only grid | `DataGrid` | P0 | Planned | Sorting, paging, column resize |
| Editable grid | `DataGrid` *(feature)* | P0 | Planned | Each cell can use a form control as its editor: text, number, currency, date, select, checkbox, lookup or a custom one |
| Row change tracking | `DataGrid` *(feature)* | P0 | Planned | Rows are flagged added/modified/deleted with their changed fields; `getChanges()` returns what to send to the API or database |
| Row metadata | `DataGrid` *(feature)* | P0 | Planned | Each row carries a typed `meta: TMeta` (ids, version, flags) that is never displayed or copied |
| Excel copy/paste | `DataGrid` *(feature)* | P0 | Planned | Ctrl+C/Ctrl+V as tab-separated text plus HTML; values are parsed and validated on paste |
| Line item grid | `LineItemGrid` *(variant)* | P0 | Planned | Order/invoice lines: add row, totals footer |
| Master-detail grid | `DataGrid` *(feature)* | P1 | Planned | `renderDetail` |
| Tree grid | `TreeGrid` | P1 | Planned | |
| Hierarchical grid | `TreeGrid` *(feature)* | P2 | Planned | Nested child grids |
| Grouped grid | `DataGrid` *(feature)* | P1 | Planned | Group-by with subtotals |
| Pivot grid | `PivotGrid` | P2 | Planned | |
| Spreadsheet grid | `SpreadsheetGrid` | P2 | Planned | Formulas, range select |
| Frozen columns | `DataGrid` *(feature)* | P1 | Planned | |
| Expand/collapse rows | `DataGrid` *(feature)* | P1 | Planned | |
| Row selector | `DataGrid` *(feature)* | P0 | Planned | |
| Bulk select checkbox | `DataGrid` *(feature)* | P0 | Planned | Select page vs. select all matching |

## 7. File Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| File upload | `FileUpload` | P0 | Planned | Accept list, max size, progress |
| Drag-and-drop upload | `FileUpload` *(feature)* | P1 | Planned | |
| Image upload | `ImageUpload` | P2 | Done | Preview, crop |
| Document attachment | `AttachmentList` | P0 | Planned | List with upload/download/delete for a record |
| Document preview | `DocumentPreview` | P2 | Done | PDF and images |
| Download link | `DownloadLink` | P1 | Planned | |

## 8. Navigation Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Tabs | `Tabs` | P0 | Planned | Badge for errors on hidden tabs |
| Accordion | `Accordion` | P1 | Planned | |
| Expandable section | `Section` *(feature)* | P1 | Planned | Form section with a collapsible header |
| Collapsible panel | `Panel` *(feature)* | P1 | Planned | |
| Wizard/Stepper | `Wizard` | P1 | Planned | Validation runs on each step |
| Breadcrumb | `Breadcrumb` | P1 | Planned | |
| Side panel | `SidePanel` | P1 | Planned | Docked and non-modal |
| Drawer | `Drawer` | P1 | Planned | Overlay and modal |

## 9. Validation & Status Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Required field indicator | `FormField` *(feature)* | P0 | Planned | Built into the shared field wrapper |
| Validation message | `FieldMessage` | P0 | Planned | Linked via `aria-describedby` |
| Error banner | `Alert` *(variant)* | P0 | Planned | Lists form errors that link to their fields |
| Warning message | `Alert` *(variant)* | P0 | Planned | |
| Success message | `Alert` *(variant)* / `Toast` | P0 | Planned | |
| Info message | `Alert` *(variant)* | P0 | Planned | |
| Progress indicator | `ProgressBar` | P1 | Planned | |
| Loading spinner | `Spinner` | P0 | Planned | |

## 10. Action Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Button | `Button` | P0 | In progress | Exists; needs variants, sizes and a loading state |
| Icon button | `IconButton` | P0 | Planned | `aria-label` required |
| Split button | `SplitButton` | P1 | Planned | |
| Dropdown action menu | `MenuButton` | P1 | Planned | |
| Context menu | `ContextMenu` | P2 | Planned | |
| Hyperlink | `Link` | P1 | Planned | |
| Floating action button | `Fab` | P2 | Planned | Rare on desktop ERP |
| Toolbar / action bar | `ActionBar` | P0 | Planned | Holds the standard ERP actions below |

### Standard ERP actions

These are action **definitions** (label, icon, shortcut, confirmation, permission key), not components. `ActionBar` and `MenuButton` display them.

| Action | Default shortcut | Confirm? | Typical visibility |
| --- | --- | --- | --- |
| New | Alt+N | — | Always |
| Save | Ctrl+S | — | Draft / editable |
| Save & Close | Ctrl+Shift+S | — | Draft / editable |
| Submit | — | Optional | Draft |
| Approve | — | Yes | Pending approval, approver only |
| Reject | — | Yes, with reason | Pending approval, approver only |
| Post | — | Yes | Approved, not posted |
| Release | — | Yes | Approved |
| Cancel | Esc | If dirty | Always |
| Delete | — | Yes (destructive) | Draft only |
| Print | Ctrl+P | — | Always |
| Export | — | — | Lists / grids |
| Import | — | — | Lists / grids |

## 11. Workflow Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Status badge | `StatusBadge` | P0 | Planned | Maps status → color/label |
| Approval selector | `ApproverPicker` | P1 | Planned | Built on `EmployeeLookup` |
| Workflow stage indicator | `WorkflowStages` | P1 | Planned | Draft → Submitted → Approved → Posted |
| Workflow timeline | `WorkflowTimeline` | P1 | Planned | |
| Approval workflow panel | `ApprovalPanel` | P0 | Planned | Combines stages, approvers and approve/reject actions |
| Comments panel | `CommentsPanel` | P0 | Planned | Also covers the "Comments/Notes field" |
| Activity feed | `ActivityFeed` | P1 | Planned | Audit trail |
| Electronic signature control | `SignatureField` | P2 | Done | Typed and drawn; check compliance requirements |

## 12. Reporting & Analytics Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| KPI card | `KpiCard` | P1 | Planned | Value, delta, sparkline |
| Summary card | `SummaryCard` | P1 | Planned | |
| Chart | `Chart` | P1 | Planned | Wrap a charting library |
| Dashboard widget | `Widget` | P2 | Planned | Card frame with a header menu |
| Drill-down link | `DrillLink` | P2 | Planned | |
| Pivot selector | `PivotFieldList` | P2 | Planned | Rows/columns/values selection for `PivotGrid` |

## 13. Filter Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Filter panel | `FilterPanel` | P0 | Planned | Hosts the filters below |
| Quick filter | `QuickFilter` | P1 | Planned | Chip row above a grid |
| Advanced filter | `FilterBuilder` | P2 | Planned | AND/OR condition builder |
| Search panel | `SearchPanel` | P1 | Planned | |
| Range filter | `RangeFilter` | P1 | Planned | Numbers and dates |
| Multi-select filter | `MultiSelect` *(reuse)* | P1 | Planned | |
| Saved filter | `SavedFilters` | P2 | Planned | |
| Favorite filter | `SavedFilters` *(feature)* | P2 | Planned | |

## 14. Reference & Display Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Label | `Label` | P0 | Planned | |
| Help text | `FormField` *(feature)* | P0 | Planned | |
| Tooltip | `Tooltip` | P0 | Planned | Must work with keyboard focus, not just hover |
| Badge | `Badge` | P1 | Planned | Counts |
| Tag/Chip | `Tag` | P1 | Planned | Removable |
| Read-only value display | `ValueDisplay` | P1 | Planned | Formats by type: currency, date… |
| Calculated field display | `ValueDisplay` *(feature)* | P1 | Planned | Shows a "calculated" marker |
| Hyperlink display | `Link` *(reuse)* | P1 | Planned | |

## 15. Enterprise Advanced Controls

| Control | Component | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| Tree view (generic) | `TreeView` | P0 | Planned | Base for the trees below |
| Organization tree | `TreeView` *(variant)* | P2 | Planned | |
| Account tree | `TreeView` *(variant)* | P2 | Planned | Chart of accounts |
| Product hierarchy tree | `TreeView` *(variant)* | P2 | Planned | |
| BOM editor | `BomEditor` | P2 | Planned | Built on `TreeGrid` |
| Matrix/Grid editor | `MatrixEditor` | P2 | Planned | Size × color, period × account |
| Kanban board | `KanbanBoard` | P2 | Planned | |
| Gantt chart | `GanttChart` | P2 | Planned | |
| Scheduler | `Scheduler` | P2 | Planned | |
| Timeline | `Timeline` | P2 | Planned | |
| Resource planner | `ResourcePlanner` | P2 | Planned | |

---

## Shared building blocks (build these first)

Not on the list above, but almost every control depends on them:

| Component | Purpose |
| --- | --- |
| `FormField` | Label, required marker, help text, error message and ARIA wiring around any input |
| `Popover` | Positioned overlay for Select, DatePicker, Lookup and Tooltip |
| `Listbox` | Keyboard-navigable option list shared by Select, ComboBox, AutoComplete and Lookup |
| `Form` | Form state, dirty tracking, validation, submit handling |
| `Icon` | Icon set |
| Design tokens | Colors, spacing, typography, density (`compact` matters in ERP) |

## Top 20, mapped to components

| # | Control | Component |
| --- | --- | --- |
| 1 | Text Box | `TextField` |
| 2 | Text Area | `TextArea` |
| 3 | Dropdown | `Select` |
| 4 | Searchable Lookup | `Lookup` |
| 5 | Checkbox | `Checkbox` |
| 6 | Radio Button | `RadioGroup` |
| 7 | Date Picker | `DatePicker` |
| 8 | Number Field | `NumberField` |
| 9 | Currency Field | `CurrencyField` |
| 10 | Auto-Complete | `AutoComplete` |
| 11 | Multi-Select | `MultiSelect` |
| 12 | Data Grid | `DataGrid` |
| 13 | File Attachment | `AttachmentList` / `FileUpload` |
| 14 | Tab Control | `Tabs` |
| 15 | Button | `Button` |
| 16 | Status Badge | `StatusBadge` |
| 17 | Filter Panel | `FilterPanel` |
| 18 | Tree View | `TreeView` |
| 19 | Approval Workflow Panel | `ApprovalPanel` |
| 20 | Comments/Notes Field | `CommentsPanel` |

## Notes on numbers and money

- Do not store currency as a JS `number` when you do arithmetic. Pass values as strings or minor units (cents) and format at the edge.
- Parse input by locale: `1.234,56` in de-DE equals `1,234.56` in en-US.
- Decide once whether `PercentField` stores `0.15` or `15`, and use it for every control.
