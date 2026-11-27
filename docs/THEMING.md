# Theming and customization

Every visual decision in enterract comes from CSS custom properties (design tokens) named `--erp-*`. You can restyle the whole library from your app's own CSS, with no rebuild of the library and no fork.

## 1. Override tokens (recommended)

Set any token on `:root` for the whole app, or on any element for one part of the page:

```css
/* app.css */
:root {
  --erp-color-primary: #7a1fa2;
  --erp-color-primary-hover: #63168a;
  --erp-color-primary-subtle: #f3e5f8;
  --erp-color-focus: #7a1fa2;
  --erp-font-family: 'Inter', system-ui, sans-serif;
  --erp-radius: 2px;
}
```

**Your values always win.** The library declares its defaults with `:where(:root)`, which has zero specificity, so a plain `:root { … }` in your CSS overrides them no matter which stylesheet the browser loads first. You don't need `!important` or any import-order tricks.

### Scoped themes (dark mode, brands, tenants)

Tokens inherit, so a theme can be applied to a subtree:

```css
[data-theme='dark'] {
  --erp-color-text: #e6e9ee;
  --erp-color-text-muted: #9aa5b1;
  --erp-color-bg: #14181d;
  --erp-color-bg-subtle: #1b2027;
  --erp-color-bg-muted: #232a33;
  --erp-color-bg-hover: #29313b;
  --erp-color-bg-readonly: #1b2027;
  --erp-color-border: #3a4450;
  --erp-color-border-subtle: #2b333d;
  --erp-color-border-strong: #56626f;
  --erp-color-selected: #1d3557;
  --erp-color-changed: #3a3214;
}
```

```tsx
<div data-theme='dark'>{/* every enterract control inside uses the dark tokens */}</div>
```

### Density

Set `data-density="compact"` on any ancestor to switch controls to the small size (useful for data-heavy screens). Controls also take a `size="sm" | "md"` prop.

### Token reference

| Group | Tokens |
| --- | --- |
| Typography | `--erp-font-family`, `--erp-font-family-mono`, `--erp-font-size-xs` … `--erp-font-size-2xl`, `--erp-font-weight-medium`, `--erp-font-weight-bold`, `--erp-line-height` |
| Text and surfaces | `--erp-color-text`, `--erp-color-text-muted`, `--erp-color-text-inverse`, `--erp-color-bg`, `--erp-color-bg-subtle`, `--erp-color-bg-muted`, `--erp-color-bg-hover`, `--erp-color-bg-readonly` |
| Borders | `--erp-color-border`, `--erp-color-border-subtle`, `--erp-color-border-strong` |
| Brand | `--erp-color-primary`, `--erp-color-primary-hover`, `--erp-color-primary-subtle`, `--erp-color-on-primary` |
| Status | `--erp-color-danger`, `--erp-color-danger-hover`, `--erp-color-danger-subtle`, `--erp-color-warning`, `--erp-color-warning-subtle`, `--erp-color-success`, `--erp-color-success-subtle`, `--erp-color-info`, `--erp-color-info-subtle` |
| Focus | `--erp-color-focus`, `--erp-focus-ring` |
| Data states (grids) | `--erp-color-changed`, `--erp-color-added`, `--erp-color-selected` |
| Spacing | `--erp-space-1` … `--erp-space-6` |
| Shape | `--erp-radius-sm`, `--erp-radius`, `--erp-radius-lg`, `--erp-radius-pill` |
| Controls | `--erp-control-height`, `--erp-control-height-sm`, `--erp-control-padding-x`, `--erp-control-padding-x-sm` |
| Elevation | `--erp-shadow-sm`, `--erp-shadow-popover`, `--erp-shadow-overlay`, `--erp-backdrop` |
| Layering | `--erp-z-sticky`, `--erp-z-drawer`, `--erp-z-popover`, `--erp-z-toast` |
| Motion | `--erp-transition` (0 ms when the user prefers reduced motion) |
| Charts | `--erp-chart-1` … `--erp-chart-8` (series colors, in order), `--erp-chart-grid`, `--erp-chart-axis` |

The default values are in [`src/styles/tokens.css`](../src/styles/tokens.css).

## 2. Restyle a single component

Every component accepts `className` (and native props such as `style`), and renders stable `erp-*` class names plus `data-*` state attributes (`data-variant`, `data-size`, `data-invalid`, `data-active`, …). Each component doc lists them in its **Styling** table.

```css
/* Make every primary button pill-shaped */
.my-app .erp-button[data-variant='primary'] {
  border-radius: var(--erp-radius-pill);
}
```

The library's own rules mostly use a single class, so prefix yours with an app-level class (as above) or pass a `className` to be sure they win regardless of load order.

## 3. How the CSS is delivered

- Each component imports its own stylesheet, and the shared tokens and base styles are a single file. Your bundler (Vite, webpack, Next.js app router, …) includes only the CSS for the components you import.
- No CSS-in-JS runtime and no global resets: the library styles only its own `erp-*` classes.
- Class names, `data-*` attributes and tokens are the supported styling surface. Inner DOM structure that is not listed in a component's Styling table may change between minor versions.
