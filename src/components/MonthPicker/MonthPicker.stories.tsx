import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { MonthPicker } from './MonthPicker'

const meta = {
  title: 'Components/MonthPicker',
  component: MonthPicker,
  args: { label: 'Reporting month', defaultValue: '2026-03-01', today: '2026-03-15', onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MonthPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { locale: 'en-US' },
  play: async ({ args, canvasElement }) => {
    within(canvasElement).getByRole('button', { name: /reporting month/i }).focus()
    await userEvent.keyboard('{Enter}{ArrowRight}{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('2026-04-01', undefined)
  },
}

export const MinMax: Story = { args: { min: '2025-10-01', max: '2026-06-30' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, defaultValue: null } }

export const WithError: Story = { args: { error: 'Month is already closed' } }

export const Compact: Story = { args: { size: 'sm' } }
