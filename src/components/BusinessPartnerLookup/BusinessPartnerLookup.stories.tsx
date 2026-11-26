import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { partnerSource, type SamplePartner } from '../../test/erpFixtures'
import { BusinessPartnerLookup } from './BusinessPartnerLookup'

const meta = {
  title: 'Components/BusinessPartnerLookup',
  component: BusinessPartnerLookup<SamplePartner>,
  args: {
    dataSource: partnerSource,
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
} satisfies Meta<typeof BusinessPartnerLookup<SamplePartner>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'group')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('B9001', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'B9001' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'B9001' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'B9001' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Business partner is required' } }

export const Compact: Story = { args: { size: 'sm' } }
