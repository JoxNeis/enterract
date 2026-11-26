# Component Conventions

How to add a component to enterract. `Button` is the reference implementation.

## Folder layout

```text
src/components/<Name>/
  <Name>.tsx          # component + exported props type
  <Name>.css          # styles, scoped by the erp-<name> class
  <Name>.test.tsx     # Vitest + Testing Library
  <Name>.stories.tsx  # Storybook, title "Components/<Name>"
  index.ts            # export { Name } and type { NameProps }
docs/components/<Name>.md   # from docs/components/_TEMPLATE.md
```

Then add `export * from './components/<Name>'` to [src/main.ts](../src/main.ts). The package exposes each folder as `enterract/components/<Name>`.

## Code

- **Props type:** `export type <Name>Props = ...`. Extend the native element's `ComponentProps<'el'>` when the component wraps one element.
- **Class names:** root class `erp-<kebab-name>`, parts `erp-<kebab-name>__<part>`, modifiers `erp-<kebab-name>--<modifier>`. Always merge the consumer's `className`.
- **Safe defaults:** follow `Button`'s `type="button"`. Defaults must never submit, delete or post anything unexpectedly.
- **Form controls** must follow the [Form Control Contract](FORM-CONTROL-CONTRACT.md).
- **No runtime dependencies** without discussion. Wrap heavy third-party engines (rich text, charts, Gantt) behind our own props API.
- **State attributes for styling:** use `data-*` and ARIA attributes (`aria-invalid`, `data-size="sm"`) rather than extra classes where possible.

## Accessibility (required, not optional)

- Every interactive control has an accessible name.
- Follow the WAI-ARIA Authoring Practices pattern for the widget (combobox, listbox, grid, tabs, tree, dialog), and name the pattern in the component doc.
- Visible focus ring on every focusable element.
- Errors are announced through `aria-describedby` / `aria-invalid`, not through color alone.

## Tests (minimum)

- Renders with the default props
- Forwards `className` and native props
- Controlled and uncontrolled value (form controls)
- Keyboard interaction for every documented key
- `disabled` / `readOnly` behavior

## Storybook compliance

Every component must work fully in Storybook. Storybook is the library's living documentation and where reviewers check a component, so a component without stories is not done.

### File and naming

- `src/components/<Name>/<Name>.stories.tsx`, picked up by the `../src/**/*.stories.@(ts|tsx)` glob in [.storybook/main.ts](../.storybook/main.ts).
- `title: 'Components/<Name>'`. Use one title per component; don't nest variants under separate titles.
- Default export typed with `satisfies Meta<typeof Name>`, stories typed as `StoryObj<typeof meta>`, the same as [Button.stories.tsx](../src/components/Button/Button.stories.tsx).

### Args and controls

- Every public prop that can be serialized (strings, numbers, booleans, unions) must work from the Controls panel. Use `argTypes` to choose the control (`inline-radio` for small unions, `select` for larger ones).
- Props that can't be serialized (functions, ReactNode, large arrays) get `control: false` and a fixed value in `args` or `render`.
- Event props use `fn()` from `storybook/test` so they show in the Actions panel.

### Autodocs

- Autodocs is on for every story file (set in [.storybook/preview.ts](../.storybook/preview.ts)). Don't turn it off.
- Put a JSDoc comment on the component and on each prop in the props type. Autodocs uses these for the description and the props table.

### Data and determinism

- Story data lives in `<Name>.fixtures.ts` next to the stories and is shared with the tests.
- No `Date.now()`, `Math.random()` or network calls in stories. Use fixed dates and fake data sources, so a story renders the same way every time.

### Stateful components

- Controlled components need a `render` that holds state (`useState` or the component's hook), so the story is interactive and not frozen at its initial args.
- Still pass the change callback through to the `fn()` arg so the Actions panel logs it.

### Interaction tests

- Key behavior gets a `play` function (from `storybook/test`: `userEvent`, `within`, `expect`). The Interactions panel then shows the steps.
- Use the same queries as the unit tests (by role and label, not by class name).

### Minimum stories

`Default`, `Disabled`, and one story for each variant or state. Form controls also get `ReadOnly`, `Required`, `WithError` and `Compact`. Complex components list their required stories in their own doc.

## Definition of done

- [ ] Code, CSS, tests, stories and `index.ts`
- [ ] All required stories present, controls work, autodocs page renders
- [ ] `play` functions pass in the Storybook Interactions panel
- [ ] `npm run build-storybook` succeeds
- [ ] Exported from `src/main.ts`
- [ ] `docs/components/<Name>.md` written
- [ ] Status updated in [CONTROLS.md](CONTROLS.md)
- [ ] `npm run check` passes
