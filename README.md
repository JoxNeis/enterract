# enterract

A React component library for ERP applications: forms, lookups, Excel-style data grids, workflow and approval controls. 100+ accessible components, no runtime dependencies besides React.

## Install

```sh
npm install enterract
```

Peer dependencies: `react` and `react-dom` 19. The package is ESM with TypeScript types included.

## Usage

```tsx
import { Button, TextField, LocaleProvider } from 'enterract'
// or import one component (smaller dev builds):
import { DataGrid, useGridRows } from 'enterract/components/DataGrid'

export function App() {
  return (
    <LocaleProvider locale='de-DE' currency='EUR'>
      <TextField label='Reference' />
      <Button variant='primary'>Save</Button>
    </LocaleProvider>
  )
}
```

Styles load automatically with each component; you don't import a CSS file. `LocaleProvider` sets number, date and currency formatting for everything inside it.

## Customizing the look

Everything is driven by `--erp-*` CSS variables. Override them in your own CSS and they always win, whatever the load order:

```css
:root {
  --erp-color-primary: #7a1fa2;
  --erp-font-family: 'Inter', sans-serif;
  --erp-radius: 2px;
}
```

You can also theme part of a page (dark mode, per-tenant brands), switch density with `data-density="compact"`, or restyle single components through `className` and their `erp-*` classes. See [Theming](docs/THEMING.md).

## Development

| Command | |
| --- | --- |
| `npm run storybook` | Component explorer with docs, on :6006 |
| `npm test` | Vitest in watch mode |
| `npm run check` | Typecheck, lint, tests and audit |
| `npm run build` | Library build to `dist/` |
| `npm run build-storybook` | Static Storybook to `storybook-static/` |
| `npm pack` | Create the installable `.tgz` |

## Docs

- [Theming and customization](docs/THEMING.md)
- [Control catalog](docs/CONTROLS.md): every control and its status
- [Roadmap](docs/ROADMAP.md)
- [Form control contract](docs/FORM-CONTROL-CONTRACT.md)
- [Component conventions](docs/CONVENTIONS.md)
- [Component docs](docs/components/)
