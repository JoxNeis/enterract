import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { locationSource, type SampleLocation } from '../../test/erpFixtures'
import { LocationLookup } from './LocationLookup'

const meta = {
  title: 'Components/LocationLookup',
  component: LocationLookup<SampleLocation>,
  args: {
    dataSource: locationSource,
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
} satisfies Meta<typeof LocationLookup<SampleLocation>>

export default meta
type Story = StoryObj<typeof meta>

/** Type to search or press F4 to browse. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), 'rack 4')
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('A-04-1', expect.anything())
  },
}

export const WithValue: Story = { args: { defaultValue: 'A-04-1' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'A-04-1' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'A-04-1' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Location is required' } }

export const Compact: Story = { args: { size: 'sm' } }
