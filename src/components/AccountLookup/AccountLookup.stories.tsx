import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { accountSource, type SampleAccount } from '../../test/erpFixtures'
import { AccountLookup } from './AccountLookup'

const meta = {
  title: 'Components/AccountLookup',
  component: AccountLookup<SampleAccount>,
  args: {
    dataSource: accountSource,
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
} satisfies Meta<typeof AccountLookup<SampleAccount>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'rent')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('6200', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: '6200' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: '6200' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: '6200' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Account is required' } }

export const Compact: Story = { args: { size: 'sm' } }
