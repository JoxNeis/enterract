# RichTextEditor

A small formatted-text editor for notes, terms and conditions, and email bodies. Its value is sanitized HTML.

**Status:** Done  
**Priority:** P2  
**Category:** Text Inputs  
**ARIA pattern:** [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) + multi-line `textbox`

## Import

```tsx
import { RichTextEditor } from 'enterract'
// or
import { RichTextEditor } from 'enterract/components/RichTextEditor'
```

## Usage

```tsx
const [terms, setTerms] = useState<string | null>(null)

<RichTextEditor
  label="Terms and conditions"
  value={terms}
  onChange={setTerms}
  maxLength={2000}
/>
```

## When to use

- Use it for text that is printed or emailed with light formatting, such as quote terms, delivery instructions or approval notes.
- Don't use it for plain remarks. Use `TextArea` instead, which is simpler to store, search and export.
- Don't use it for full documents or templates with tables and images. Wrap a dedicated editor engine behind the same props instead.

> **Deviation from the catalog note:** the catalog suggests wrapping an existing editor engine. The library has no
> runtime dependencies, so it ships a deliberately small built-in editor that uses the browser's
> editing commands. The props (`value` is an HTML string, `onChange(html)`) are designed so you can swap in an engine such as
> Tiptap or Lexical later without changing callers.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| null` | — | Controlled HTML (sanitized before display). |
| `defaultValue` | `string \| null` | `null` | Uncontrolled initial HTML. |
| `onChange` | `(html: string \| null) => void` | — | Sanitized HTML, or `null` when the editor is empty. |
| `placeholder` | `string` | — | Shown when empty. |
| `maxLength` | `number` | — | Shows a `n / max` counter of the plain text. Text over the limit sets an error. |
| `rows` | `number` | `6` | Minimum height in lines. |

Also accepts the [Form Control Contract](../FORM-CONTROL-CONTRACT.md) props and native `<div>` props, which go to the editable element.

## Variants & states

| Variant / state | Description |
| --- | --- |
| Default | Toolbar with bold, italic, underline, bulleted and numbered lists, heading, link and clear formatting. |
| Character limit | Counter in the footer. Over the limit it turns red, sets `aria-invalid` and shows a message. |
| Read-only | No toolbar, not editable, text can still be selected and copied. |
| Disabled | Not editable or focusable, dimmed. |
| Error | Red border and an error message linked with `aria-describedby`. |
| Compact | `size="sm"`. |

## Keyboard

| Key | Action |
| --- | --- |
| Ctrl/⌘ + B | Bold |
| Ctrl/⌘ + I | Italic |
| Ctrl/⌘ + U | Underline |
| Ctrl/⌘ + K | Insert link (asks for an `https:` or `mailto:` address) |
| Tab | Moves focus out of the editor (tabs are not inserted). |

## Accessibility

- **Roles:** `role="textbox"` with `aria-multiline="true"`. The formatting buttons are in a `role="toolbar"`, and toggles report `aria-pressed`.
- **Labelling:** the field label via `aria-labelledby`. Toolbar buttons have names that include their shortcut, such as "Bold (Ctrl+B)".
- **Announcements:** errors and help text via `aria-describedby`. `aria-required`, `aria-invalid`, `aria-readonly` and `aria-disabled` are set as needed.

## Security

`sanitizeHtml` keeps only `p, br, strong, em, u, ul, ol, li, h3, h4, a, blockquote`. It renames `b`, `i` and `div`, and drops every
attribute except a safe `href` (`http(s):`, `mailto:`, `tel:`, relative). It removes `<script>`, `<style>`, `<iframe>`, event handlers
and `javascript:` links. Pasted HTML is sanitized, and pasted plain text is escaped. Sanitize again on the server before storing or rendering.

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-rich-text` | Root (form field) |
| `.erp-rich-text__box` (`[data-invalid]`, `[data-disabled]`, `[data-readonly]`) | Border around toolbar and editor |
| `.erp-rich-text__toolbar` | Formatting buttons |
| `.erp-rich-text__editor` (`[data-empty]`) | Editable area; placeholder via `data-placeholder` |
| `.erp-rich-text__count` (`[data-over]`) | Character counter |

## Storybook

Follows [Storybook compliance](../CONVENTIONS.md#storybook-compliance).

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | Empty editor with placeholder | Types text, expects `onChange` |
| `WithContent` | Heading, emphasis, list, link | — |
| `Formatting` | Toolbar on the selection | Bold, then type, expects `<strong>` |
| `CharacterLimit` | Counter and limit error | — |
| `Disabled` | Disabled | — |
| `ReadOnly` | No toolbar | Asserts the toolbar is absent |
| `Required` | Required marker | — |
| `WithError` | Error message | — |
| `Compact` | `size="sm"` | — |

## ERP notes

- Store the HTML string and also `htmlToText(html)` for search, exports and grid previews.
- Lock it with `readOnly` once the document is approved or posted. The content still renders formatted.

## Related

- `TextArea`
- `CommentsPanel`
