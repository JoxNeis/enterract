import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { DualListSelector } from './DualListSelector'

const columns = [
  { key: 'docNo', label: 'Document no.' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'city', label: 'City' },
  { key: 'salesperson', label: 'Salesperson' },
  { key: 'net', label: 'Net amount' },
  { key: 'tax', label: 'Tax' },
  { key: 'gross', label: 'Gross amount' },
  { key: 'status', label: 'Status' },
  { key: 'internal', label: 'Internal notes', disabled: true },
]

const meta = {
  title: 'Components/DualListSelector',
  component: DualListSelector,
  args: {
    label: 'Report columns',
    options: columns,
    defaultValue: ['docNo', 'date', 'customer', 'gross'],
    orderable: true,
    searchable: true,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    size: 'md',
  },
  argTypes: { options: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DualListSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(within(canvas.getByRole('listbox', { name: /available/i })).getByRole('option', { name: 'Tax' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['docNo', 'date', 'customer', 'gross', 'tax'])
  },
}

export const Empty: Story = { args: { defaultValue: [] } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, defaultValue: [] } }

export const WithError: Story = { args: { defaultValue: [], error: 'Pick at least one column' } }

export const Compact: Story = { args: { size: 'sm' } }
