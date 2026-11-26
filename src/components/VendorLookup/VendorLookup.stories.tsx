import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { vendorSource, type SampleVendor } from '../../test/erpFixtures'
import { VendorLookup } from './VendorLookup'

const meta = {
  title: 'Components/VendorLookup',
  component: VendorLookup<SampleVendor>,
  args: {
    dataSource: vendorSource,
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
} satisfies Meta<typeof VendorLookup<SampleVendor>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'delta')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('V2011', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'V2011' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'V2011' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'V2011' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Vendor is required' } }

export const Compact: Story = { args: { size: 'sm' } }
