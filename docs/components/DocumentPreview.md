# DocumentPreview

A viewer for PDFs and images, with zoom, rotate, download and paging through several attachments.

**Status:** Done  
**Priority:** P2  
**Category:** File Controls  
**ARIA pattern:** `region` with a [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

## Import

```tsx
import { DocumentPreview } from 'enterract'
// or
import { DocumentPreview } from 'enterract/components/DocumentPreview'
```

## Usage

```tsx
<DocumentPreview
  files={[
    { name: 'INV-2026-0318.png', url: scanUrl },
    { name: 'PO-7781.pdf', url: poUrl },
  ]}
  height="32rem"
/>
```

## When to use

- Use it to show an invoice scan next to the invoice form, delivery notes and receipts in expense claims, or a contract during approval.
- Don't use it to list attachments. Use `AttachmentList`, and open the selected file in `DocumentPreview`, for example in a `SidePanel`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `files` | `readonly PreviewFile[]` | — | `{ name, url, type? }`. The type is guessed from the file name when omitted. |
| `index` | `number` | — | Controlled index of the shown file. |
| `defaultIndex` | `number` | `0` | Uncontrolled initial index. |
| `onIndexChange` | `(index: number) => void` | — | Called when paging. |
| `height` | `string` | `'28rem'` | Height of the viewing area (CSS length). |

Also accepts native `<div>` props.

## Variants & states

| Variant / state | Description |
| --- | --- |
| Image | Zoom 50–300 % in steps, rotate in 90° steps. Both reset when changing file. |
| PDF | Shown in an `<iframe>` using the browser's PDF viewer, which has its own zoom and print. |
| Unsupported type | File icon, "No preview for this file type" and a download link. |
| Several files | Previous and next buttons with an "n / total" counter. |
| Empty | "Nothing to preview". |

## Keyboard

| Key | Action |
| --- | --- |
| Tab | Moves through the toolbar buttons and links, then into the PDF frame. |
| Enter / Space | Activates the focused toolbar button. |

## Accessibility

- **Roles:** the root is a `region` named "Preview of {file}". The controls are in a `toolbar` named "Preview controls".
- **Labelling:** the image `alt` and the iframe `title` are the file name. Icon buttons have names such as "Zoom in", "Next file" and "Download {file}".
- **Announcements:** the zoom percentage is in an `aria-live="polite"` region.

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-document-preview` | Root |
| `.erp-document-preview__toolbar` | Toolbar |
| `.erp-document-preview__counter`, `__name`, `__zoom` | Toolbar text |
| `.erp-document-preview__action` | Download and open links |
| `.erp-document-preview__view` | Viewing area |
| `.erp-document-preview__image`, `__frame`, `__unsupported` | Content |

## Storybook

Follows [Storybook compliance](../CONVENTIONS.md#storybook-compliance).

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | Four attachments (image, PDF, image, spreadsheet) | Zooms in, pages forward, expects `onIndexChange(1)` |
| `SingleImage` | One scan, no paging | — |
| `Pdf` | Generated one-page PDF | — |
| `UnsupportedType` | Spreadsheet fallback | — |
| `Empty` | No files | — |
| `Compact` | Shorter viewer | — |

It is not a form control, so the Disabled, ReadOnly, Required and WithError stories do not apply.

## ERP notes

- Serve files from your API with `Content-Disposition: inline` so PDFs show instead of downloading.
- Use short-lived signed URLs for attachments. The component only needs `url`.
- PDFs from another origin can be blocked by `X-Frame-Options` or CSP `frame-ancestors`. Allow your app's origin.

## Related

- `AttachmentList`
- `FileUpload`
- `SidePanel`
