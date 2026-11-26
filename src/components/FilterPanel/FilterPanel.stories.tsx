import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { customerSource } from '../Lookup/Lookup.fixtures'
import { warehouseOptions } from '../Select/Select.fixtures'
import { FilterPanel, type FilterDefinition } from './FilterPanel'

const filters: FilterDefinition[] = [
  { id: 'search', label: 'Order no. or reference', type: 'text' },
  { id: 'customer', label: 'Customer', type: 'lookup', lookup: customerSource as FilterDefinition['lookup'] },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { key: 'draft', label: 'Draft' },
      { key: 'pending-approval', label: 'Pending approval' },
      { key: 'approved', label: 'Approved' },
      { key: 'posted', label: 'Posted' },
    ],
  },
  { id: 'warehouse', label: 'Warehouses', type: 'multiselect', options: warehouseOptions },
  { id: 'orderDate', label: 'Order date', type: 'date-range' },
  { id: 'amount', label: 'Amount', type: 'number-range' },
  { id: 'overdue', label: 'Overdue only', type: 'checkbox' },
]

const meta = {
  title: 'Components/FilterPanel',
  component: FilterPanel,
  args: {
    filters,
    onApply: fn(),
    onReset: fn(),
    onChange: fn(),
    applyMode: 'button',
    layout: 'bar',
    collapsible: false,
    size: 'sm',
  },
  argTypes: {
    filters: { control: false },
    applyMode: { control: 'inline-radio', options: ['button', 'live'] },
    layout: { control: 'inline-radio', options: ['bar', 'sidebar'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof FilterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: /order no/i }), 'SO-10{Enter}')
    await expect(args.onApply).toHaveBeenLastCalledWith({ search: 'SO-10' })
  },
}

export const Sidebar: Story = {
  args: { layout: 'sidebar' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
}

export const LiveApply: Story = { args: { applyMode: 'live' } }

export const Collapsible: Story = { args: { collapsible: true, defaultCollapsed: true, defaultValue: { overdue: true } } }

export const Disabled: Story = { args: { filters: filters.slice(0, 2) } }
