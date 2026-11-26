import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { cityNames } from '../Select/Select.fixtures'
import { AutoComplete } from './AutoComplete'

/** Fake server search with a fixed delay, so stories are deterministic. */
const loadCities = (text: string, signal: AbortSignal) =>
  new Promise<string[]>((resolve) => {
    const timer = setTimeout(() => {
      resolve(cityNames.filter((c) => c.toLowerCase().includes(text.toLowerCase())))
    }, 300)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
    })
  })

const meta = {
  title: 'Components/AutoComplete',
  component: AutoComplete,
  args: {
    label: 'Delivery city',
    suggestions: cityNames,
    minChars: 1,
    match: 'contains',
    onChange: fn(),
    onSuggestionSelect: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    match: { control: 'inline-radio', options: ['startsWith', 'contains'] },
    suggestions: { control: false },
    loadSuggestions: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AutoComplete>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'sur')
    await expect(screen.getByRole('option', { name: 'Surabaya' })).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('Surabaya', undefined)
  },
}

export const AsyncSuggestions: Story = { args: { suggestions: undefined, loadSuggestions: loadCities, debounce: 150 } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'Jakarta' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'Jakarta' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'We do not deliver to this city', defaultValue: 'Atlantis' } }

export const Compact: Story = { args: { size: 'sm' } }
