import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { warehouseOptions } from '../Select/Select.fixtures'
import { ComboBox } from './ComboBox'

const meta = {
  title: 'Components/ComboBox',
  component: ComboBox,
  args: {
    label: 'Warehouse',
    options: warehouseOptions,
    match: 'contains',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    options: { control: false },
    match: { control: 'inline-radio', options: ['startsWith', 'contains'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComboBox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'hamb{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('DE-01', undefined)
  },
}

export const AllowCreate: Story = {
  args: { label: 'Payment terms', options: [{ key: 'N30', label: 'Net 30' }], onCreate: (text: string) => text },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 'JKT-01' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'JKT-01' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Warehouse is closed for inventory count', defaultValue: 'SG-01' } }

export const Compact: Story = { args: { size: 'sm' } }
