import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { DateRangePicker } from './DateRangePicker'

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  args: {
    label: 'Invoice date',
    today: '2026-03-15',
    defaultValue: { from: '2026-03-01', to: '2026-03-15' },
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    presets: { control: false },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateRangePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { locale: 'en-US' },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Choose dates' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Last quarter' }))
    await expect(args.onChange).toHaveBeenCalledWith({ from: '2025-10-01', to: '2025-12-31' })
  },
}

export const NoPresets: Story = { args: { presets: false } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, defaultValue: null } }

export const WithError: Story = { args: { defaultValue: { from: '2026-03-20', to: '2026-03-01' } } }

export const Compact: Story = { args: { size: 'sm' } }
