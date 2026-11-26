import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { customerSource, type SampleCustomer } from '../../test/erpFixtures'
import { CustomerLookup } from './CustomerLookup'

const meta = {
  title: 'Components/CustomerLookup',
  component: CustomerLookup<SampleCustomer>,
  args: {
    dataSource: customerSource,
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
} satisfies Meta<typeof CustomerLookup<SampleCustomer>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'harbor')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('C1008', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'C1008' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'C1008' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'C1008' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Customer is required' } }

export const Compact: Story = { args: { size: 'sm' } }
