import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TimePicker } from './TimePicker'

const meta = {
  title: 'Components/TimePicker',
  component: TimePicker,
  args: { label: 'Pickup time', step: 30, onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    step: { control: 'select', options: [5, 10, 15, 30, 60] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), '1430')
    await expect(args.onChange).toHaveBeenLastCalledWith('14:30', expect.anything())
  },
}

export const BusinessHours: Story = { args: { min: '08:00', max: '17:00', step: 15, defaultValue: '09:15' } }

export const TwentyFourHour: Story = { args: { locale: 'de-DE', defaultValue: '16:45' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: '09:00' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: '09:00' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { min: '08:00', max: '17:00', defaultValue: '19:00' } }

export const Compact: Story = { args: { size: 'sm' } }
