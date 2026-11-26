# ImageUpload

A single-image field (item photo, company logo, avatar) with preview, replace and remove, and an optional crop step.

**Status:** Done  
**Priority:** P2  
**Category:** File Controls  
**ARIA pattern:** `group`. The crop step is a modal [Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Import

```tsx
import { ImageUpload } from 'enterract'
// or
import { ImageUpload } from 'enterract/components/ImageUpload'
```

## Usage

```tsx
const [logo, setLogo] = useState<ImageValue | null>({ url: company.logoUrl, name: 'logo.png' })

<ImageUpload
  label="Company logo"
  value={logo}
  onChange={setLogo}
  cropAspect={1}
  outputWidth={512}
  maxSize={2 * 1024 * 1024}
/>
// On save: if (logo?.file) upload(logo.file)
```

## When to use

- Use it for one image that represents a record, such as a product photo, logo or employee photo.
- Don't use it for several files or for documents. Use `FileUpload` with `AttachmentList`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `ImageValue \| null` | — | `{ url, name, file? }`. `file` is set only for a newly picked or cropped image. |
| `defaultValue` | `ImageValue \| null` | `null` | Uncontrolled initial value. |
| `onChange` | `(value: ImageValue \| null) => void` | — | New image or `null` after Remove. |
| `accept` | `string` | `'image/*'` | Passed to the file input. Non-image files are always rejected. |
| `maxSize` | `number` | — | Bytes. Larger files show "Image is larger than …". |
| `cropAspect` | `number` | — | Width ÷ height of the crop frame (`1` for a logo, `4/3` for a product photo). Omit it to skip cropping. |
| `outputWidth` | `number` | `800` | Width in px of the cropped PNG. |
| `previewSize` | `number` | `128` | Preview width in px. The height follows `cropAspect`. |

Also accepts the [Form Control Contract](../FORM-CONTROL-CONTRACT.md) props, except `name`.

## Variants & states

| Variant / state | Description |
| --- | --- |
| Empty | Dashed placeholder and a "Choose image" button. You can also drop an image on the preview. |
| With image | Preview, "Replace image", "Remove" and the file name. |
| Crop | After picking, a dialog shows the image in the crop frame. Drag or use the arrow keys to move it, and the slider or +/− to zoom. Apply produces a PNG. |
| Read-only / Disabled | Preview only, no actions. |
| Error / Required / Compact | As in the form control contract. |

## Keyboard

| Key | Action |
| --- | --- |
| Enter / Space on "Choose image" | Opens the file picker. |
| Arrow keys (crop frame) | Move the image 5 px, or 20 px with Shift. |
| + / − (crop frame) | Zoom in or out. |
| Esc (crop dialog) | Cancel: keeps the previous image. |

## Accessibility

- **Roles:** the root is a `group` labelled by the field label. The crop dialog is a modal `dialog` named "Crop image". The crop frame
  is `role="application"` named "Image position", so arrow keys reach it.
- **Labelling:** the preview `alt` is the file name. The zoom slider is labelled "Zoom".
- **Announcements:** validation errors via `aria-describedby`.

## Styling

| Class / attribute | Applies to |
| --- | --- |
| `.erp-image-upload` | Root (form field) |
| `.erp-image-upload__body` | Group |
| `.erp-image-upload__preview` (`[data-empty]`) | Preview box |
| `.erp-image-upload__actions`, `__name` | Buttons and file name |
| `.erp-image-upload__cropper`, `__frame`, `__zoom` | Crop dialog content |

## Storybook

Follows [Storybook compliance](../CONVENTIONS.md#storybook-compliance).

| Story | Shows | `play` test |
| --- | --- | --- |
| `Default` | Empty field | Uploads an image, expects `onChange` and a "Replace image" button |
| `WithImage` | Stored product photo | — |
| `CropLogo` | Square crop | Uploads, expects the crop dialog with the zoom slider |
| `CropProductPhoto` | 4:3 crop | — |
| `Disabled` | Disabled with image | — |
| `ReadOnly` | Stored logo, no actions | — |
| `Required` | Required marker | — |
| `WithError` | Error message | — |
| `Compact` | `size="sm"`, small preview | — |

## ERP notes

- The component does not upload. On save, upload `value.file` when it is present and store the returned URL. Without `file`, the
  image is unchanged.
- Object URLs for new images are created with `URL.createObjectURL`. A cancelled crop frees its URL right away. Revoke the URL of a
  replaced image after you save it.

## Related

- `FileUpload`
- `AttachmentList`
- `DocumentPreview`
