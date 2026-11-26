# Form Control Contract

Every input control (text, numeric, date, selection, lookup) implements this shared API. Following the same contract lets controls work in `Form` and as grid cell editors, and lets you swap one for another without changing other code.

## Value props

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `T \| null` | Controlled value. `null` means empty. Avoid `''` or `undefined` for "empty". |
| `defaultValue` | `T \| null` | Uncontrolled initial value |
| `onChange` | `(value: T \| null, event?) => void` | Emits the **parsed** value (a number for `NumberField`, an ISO date string for `DatePicker`), not raw text |
| `onBlur` | `(event) => void` | Validation-on-blur hooks in here |

Each control documents its `T`:

| Control | `T` |
| --- | --- |
| `TextField`, `TextArea`, `MaskedField` | `string` |
| `NumberField`, `PercentField`, `QuantityField` | `number` |
| `CurrencyField` | `string` (decimal string) or `{ amount: string; currency: string }` |
| `DatePicker`, `MonthPicker` | `string` (ISO `YYYY-MM-DD`) |
| `DateTimePicker` | `string` (ISO 8601 with offset) |
| `DateRangePicker` | `{ from: string \| null; to: string \| null }` |
| `Select`, `RadioGroup`, `Lookup` | `K` (option key) |
| `MultiSelect`, `CheckboxGroup`, `TagInput` | `K[]` |
| `Checkbox`, `Switch` | `boolean` |

## State props

| Prop | Type | Behavior |
| --- | --- | --- |
| `disabled` | `boolean` | Not focusable and not submitted |
| `readOnly` | `boolean` | Focusable and selectable, value is submitted, cannot be edited. Use it for posted/approved documents. |
| `required` | `boolean` | Shows the required marker and sets `aria-required` |
| `invalid` | `boolean` | Error styling and `aria-invalid`. Usually derived from `error`. |
| `loading` | `boolean` | For async controls such as lookups |

## Field props (from `FormField`)

| Prop | Type | Notes |
| --- | --- | --- |
| `label` | `ReactNode` | Required unless `aria-label` is given |
| `hideLabel` | `boolean` | Visually hidden, still announced. Use in grid cells. |
| `helpText` | `ReactNode` | Linked via `aria-describedby` |
| `error` | `ReactNode` | Linked via `aria-describedby` and sets `invalid` |
| `warning` | `ReactNode` | Non-blocking (for example "Credit limit exceeded") |
| `id` | `string` | Auto-generated with `useId()` when omitted |
| `name` | `string` | Form field key |

## Layout props

| Prop | Type | Notes |
| --- | --- | --- |
| `size` | `'sm' \| 'md'` | `sm` = compact density for grids and dense forms |
| `className` | `string` | Merged with the `erp-*` class |
| `align` | `'start' \| 'end'` | Numeric controls default to `end` |

## Rules

1. **Controlled and uncontrolled.** Support both. Never switch between them during a component's lifetime.
2. **Forward the native props** to the underlying element (`ComponentProps<'input'>` minus the props redefined here), the same way `Button` does.
3. **Refs** reach the focusable element. In React 19, `ref` is a normal prop.
4. **No silent coercion.** If the user types `12abc` into `NumberField`, keep the text, mark it invalid and emit nothing. Don't change it to `12`.
5. **Format on blur, raw on focus.** Numeric and currency fields show `1,234.50` at rest and `1234.5` while editing.
6. **Keyboard.** Every control must work without a mouse. Document its keys in the component doc.
7. **Grid editor mode.** Controls accept `autoFocus` and handle Enter/Tab/Escape so `DataGrid` can host them.
