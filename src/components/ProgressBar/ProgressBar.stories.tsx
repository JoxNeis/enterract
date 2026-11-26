import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  args: { label: 'Importing price list', value: 64, max: 100, showValue: true, tone: 'primary', size: 'md' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['primary', 'success', 'warning', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '64')
  },
}

export const Indeterminate: Story = { args: { value: undefined, label: 'Posting journal entries' } }

export const CustomText: Story = { args: { value: 7, max: 12, valueText: '7 of 12 files' } }

export const Budget: Story = { args: { label: 'Budget used', value: 92, tone: 'warning' } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { value: 0, label: 'Not started' } }
