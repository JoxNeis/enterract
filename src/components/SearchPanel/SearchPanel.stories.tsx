import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FilterPanel } from '../FilterPanel'
import { SearchPanel } from './SearchPanel'

const meta = {
  title: 'Components/SearchPanel',
  component: SearchPanel,
  args: {
    onSearch: fn(),
    placeholder: 'Search orders…',
    scopes: [
      { key: 'docNo', label: 'Order no.' },
      { key: 'customer', label: 'Customer' },
      { key: 'reference', label: 'Reference' },
    ],
    activeFilterCount: 0,
    loading: false,
  },
  argTypes: { scopes: { control: false }, advanced: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('searchbox'), 'acme{Enter}')
    await expect(args.onSearch).toHaveBeenLastCalledWith({ text: 'acme', scope: null })
  },
}

export const WithAdvancedFilters: Story = {
  args: {
    activeFilterCount: 1,
    defaultAdvancedOpen: true,
    advanced: (
      <FilterPanel
        defaultValue={{ overdue: true }}
        filters={[
          { id: 'amount', label: 'Amount', type: 'number-range' },
          { id: 'overdue', label: 'Overdue only', type: 'checkbox' },
        ]}
      />
    ),
  },
}

export const Disabled: Story = { args: { scopes: undefined, loading: true } }
