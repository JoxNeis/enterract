# Button

Triggers an action. Use it for the standard ERP actions (Save, Submit, Approve…) and any other command.

**Status:** In progress  
**Priority:** P0  
**Category:** Action Controls  
**ARIA pattern:** [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

## Import

```tsx
import { Button } from 'enterract'
// or
import { Button } from 'enterract/components/Button'
```

## Usage

```tsx
<Button onClick={save}>Save</Button>
<Button type="submit">Submit</Button>
<Button disabled>Post</Button>
```

## When to use

- Use for actions that change data or state.
- Don't use for navigation. Use `Link` instead.
- Don't use for icon-only actions. Use `IconButton` (it requires an `aria-label`).

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Defaults to `button` so it never submits a surrounding form by accident |
| `className` | `string` | — | Merged with `erp-button` |

Also accepts all native `<button>` props.

### Planned

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'secondary'` | |
| `size` | `'sm' \| 'md'` | `'md'` | |
| `loading` | `boolean` | `false` | Shows a spinner, sets `aria-busy` and blocks repeat clicks |
| `icon` | `ReactNode` | — | Leading icon |

## Keyboard

| Key | Action |
| --- | --- |
| Enter / Space | Activate |

## Styling

| Class | Applies to |
| --- | --- |
| `.erp-button` | Root |

## ERP notes

- Use one `primary` button per form section, usually Save or Submit.
- Use `danger` for Delete, Reject and Cancel-document, together with a confirmation dialog.
- Set `loading` during an async save so double-clicks don't create duplicate documents.

## Related

- `IconButton`, `SplitButton`, `MenuButton`, `ActionBar`
