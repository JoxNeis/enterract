# enterract

A React component library for ERP applications: forms, lookups, data grids, workflow and approval controls.

## Install

```sh
npm install enterract
```

Peer dependencies: `react` and `react-dom` ^19.

## Usage

```tsx
import { Button } from 'enterract'

<Button onClick={save}>Save</Button>
```

## Development

| Command | |
| --- | --- |
| `npm run storybook` | Component explorer on :6006 |
| `npm test` | Vitest in watch mode |
| `npm run check` | Typecheck, lint, tests and audit |
| `npm run build` | Build to `dist/` |

## Docs

- [Control catalog](docs/CONTROLS.md): every planned control and its status
- [Roadmap](docs/ROADMAP.md)
- [Form control contract](docs/FORM-CONTROL-CONTRACT.md)
- [Component conventions](docs/CONVENTIONS.md)
- [Component docs](docs/components/)
