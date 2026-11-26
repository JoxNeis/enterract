# ComponentName

One sentence: what it is and when to use it.

**Status:** Planned  
**Priority:** P0  
**Category:** Text Inputs  
**ARIA pattern:** [link to the WAI-ARIA APG pattern, if one applies]

## Import

```tsx
import { ComponentName } from 'enterract'
// or
import { ComponentName } from 'enterract/components/ComponentName'
```

## Usage

```tsx
<ComponentName label="..." value={value} onChange={setValue} />
```

## When to use

- Use when …
- Don't use when … use `OtherComponent` instead.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| | | | |

Also accepts the [Form Control Contract](../FORM-CONTROL-CONTRACT.md) props *(form controls only)* and the native `<element>` props.

## Variants & states

| Variant / state | Description |
| --- | --- |
| | |

## Keyboard

| Key | Action |
| --- | --- |
| | |

## Accessibility

- Role(s):
- Labelling:
- Announcements:

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-component-name` | Root |

## Storybook

Follows [Storybook compliance](../CONVENTIONS.md#storybook-compliance).

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | | |
| `Disabled` | | |

## ERP notes

Domain behavior: posting rules, read-only after approval, locale/currency handling, etc.

## Related

- `OtherComponent`
