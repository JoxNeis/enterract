# SignatureField

An electronic signature: draw it with a mouse, pen or finger, or type a name. Stores a PNG and the time of signing.

**Status:** Done  
**Priority:** P2  
**Category:** Workflow Controls  
**ARIA pattern:** `group` with a [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) for the method

## Import

```tsx
import { SignatureField } from 'enterract'
// or
import { SignatureField } from 'enterract/components/SignatureField'
```

## Usage

```tsx
const [signature, setSignature] = useState<SignatureValue | null>(null)

<SignatureField
  label="Received by"
  statement="I confirm the goods were received in good condition."
  value={signature}
  onChange={setSignature}
  required
/>
```

## When to use

- Use it for proof of delivery, goods receipt, timesheet or expense sign-off, and acknowledging a policy.
- Don't use it as a legally binding e-signature without checking your requirements (for example eIDAS or ESIGN). Those often need
  identity verification, audit trails and certificate-based signing from a dedicated provider.
- Don't use it for approvals inside the ERP. Use `ApprovalPanel`, which records who approved and when.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `SignatureValue \| null` | — | Controlled value. |
| `defaultValue` | `SignatureValue \| null` | `null` | Uncontrolled initial value. |
| `onChange` | `(value: SignatureValue \| null) => void` | — | Called when a stroke ends, the typed name changes, or the signature is cleared (`null`). |
| `defaultMode` | `'draw' \| 'type'` | `'draw'` | Initial method. |
| `statement` | `string` | — | Text the signer agrees to, shown above the pad. |
| `now` | `() => string` | current time | Clock for `signedAt`; pass a fixed function in tests and stories. |

`SignatureValue` is `{ mode: 'draw' | 'type'; name?: string; dataUrl: string; signedAt: string }`. `dataUrl` is a PNG, and
`signedAt` is an ISO 8601 instant.

Also accepts the [Form Control Contract](../FORM-CONTROL-CONTRACT.md) props and native `<div>` props.

## Variants & states

| Variant / state | Description |
| --- | --- |
| Draw | Freehand on a 480 × 140 canvas that scales to the container width. |
| Type name | A "Full name" text field rendered in a script font onto the canvas. |
| Signed | Help text shows "Signed {date, time}" in the locale and time zone. |
| Read-only | Shows the stored signature with no method switch and no Clear button. |
| Disabled / Error / Required / Compact | As in the form control contract. |

## Keyboard

| Key | Action |
| --- | --- |
| Tab | Moves between the method buttons, the name field and Clear. |
| Enter / Space | Picks a method, or clears. |
| Typing | In "Type name" mode this is the keyboard-accessible way to sign. |

## Accessibility

- **Roles:** the root is a `group` labelled by the field label. The method choice is a `radiogroup`. The pad is a `role="img"` canvas
  named "Signature pad…" when empty and "Signature of {name}" once signed.
- **Labelling:** the field label via `aria-labelledby`. The statement is visible text above the pad.
- **Announcements:** errors and the "Signed …" help text via `aria-describedby`.
- Drawing needs a pointer. Typing a name is the equivalent alternative and must stay available.

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-signature` | Root (form field) |
| `.erp-signature__body` (`[data-invalid]`) | Group |
| `.erp-signature__statement` | Statement text |
| `.erp-signature__modes` | Draw / Type name switch |
| `.erp-signature__pad` (`[data-mode]`, `[data-empty]`) | Canvas |
| `.erp-signature__typed` | Text fallback when no canvas is available |
| `.erp-signature__actions`, `.erp-signature__line` | "Sign above the line" and Clear |

## Storybook

Follows [Storybook compliance](../CONVENTIONS.md#storybook-compliance).

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | Draw mode with statement | Draws a stroke, expects `onChange` with `mode: 'draw'` |
| `TypeName` | Type mode | Types a name, expects `onChange` with the name |
| `Signed` | Stored drawn signature | — |
| `Disabled` | Disabled | — |
| `ReadOnly` | Stored drawn signature, no controls | — |
| `ReadOnlyTyped` | Stored typed signature | — |
| `Required` | Required marker | — |
| `WithError` | Error message | — |
| `Compact` | `size="sm"` | — |

## ERP notes

- Save `signedAt` from the server clock when you can. The client value is for display.
- Store the signer's user ID and the document version next to the PNG so the signature is tied to what was signed.
- Make the field `readOnly` once the document is posted.

## Related

- `ApprovalPanel`
- `FileUpload`
