import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { warehouseSource, type SampleWarehouse } from '../../test/erpFixtures'
import { WarehouseLookup } from './WarehouseLookup'

const meta = {
  title: 'Components/WarehouseLookup',
  component: WarehouseLookup<SampleWarehouse>,
  args: {
    dataSource: warehouseSource,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    dataSource: { control: false },
    columns: { control: false },
    displayValue: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WarehouseLookup<SampleWarehouse>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'hamburg')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('HAM-01', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'HAM-01' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'HAM-01' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'HAM-01' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Warehouse is required' } }

export const Compact: Story = { args: { size: 'sm' } }
