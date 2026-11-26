import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { YearPicker } from './YearPicker'

const meta = {
  title: 'Components/YearPicker',
  component: YearPicker,
  args: { label: 'Budget year', currentYear: 2026, defaultValue: 2026, onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof YearPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /budget year/i }))
    await userEvent.keyboard('{ArrowLeft}{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith(2025, undefined)
  },
}

export const Range: Story = { args: { min: 2020, max: 2030 } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, defaultValue: null } }

export const WithError: Story = { args: { error: 'No budget defined for this year' } }

export const Compact: Story = { args: { size: 'sm' } }
