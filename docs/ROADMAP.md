# Roadmap

Build in dependency order. Each phase only uses what earlier phases built.

## Phase 0: Foundations
- Design tokens (color, spacing, type, `compact` density)
- `Icon`, `Spinner`, `Label`, `FormField`, `FieldMessage`
- `Popover`, `Listbox` (internal primitives)
- Finish `Button`: variants (primary/secondary/danger/ghost), sizes, `loading`, icon slot

## Phase 1: Core form (P0)
- `TextField`, `TextArea`, `SearchField`
- `NumberField`, `CurrencyField`
- `Checkbox`, `RadioGroup`, `Switch`
- `Select`, `MultiSelect`, `AutoComplete`
- `Calendar`, `DatePicker`
- `Alert`, `Tooltip`, `IconButton`
- `Form` (state, dirty tracking, validation)

## Phase 2: ERP core (P0)
- `Lookup`, plus a data-source adapter interface for paged server search
- `DataGrid`, in this order: read-only with typed row `meta`, then row select / bulk select, then cell editors (text, number, select, checkbox, lookup), then change tracking (`useGridRows`, `getChanges`), then Excel copy/paste
- `LineItemGrid`
- `Tabs`, `Section`
- `ActionBar` with the standard action definitions
- `StatusBadge`
- `FileUpload`, `AttachmentList`
- `FilterPanel`
- `TreeView`
- `CommentsPanel`, `ApprovalPanel`

## Phase 3: Breadth (P1)
- Remaining numeric fields (`PercentField`, `QuantityField`) and date pickers
- ERP lookup presets (`CustomerLookup`, `ItemLookup`, `AccountLookup`…)
- Grid features: grouping, frozen columns, master-detail, `TreeGrid`
- Navigation: `Accordion`, `Wizard`, `Breadcrumb`, `Drawer`, `SidePanel`
- Workflow: `WorkflowStages`, `WorkflowTimeline`, `ActivityFeed`
- `KpiCard`, `SummaryCard`, `Chart`
- `MaskedField`, `PasswordField`, `TagInput`, `ComboBox`, `TreeSelect`

## Phase 4: Advanced (P2)
- `PivotGrid`, `SpreadsheetGrid`, `FilterBuilder`, `SavedFilters`
- `BomEditor`, `MatrixEditor`
- `KanbanBoard`, `GanttChart`, `Scheduler`, `Timeline`, `ResourcePlanner`
- `RichTextEditor`, `SignatureField`, `DocumentPreview`
