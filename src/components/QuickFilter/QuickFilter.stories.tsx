import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { QuickFilter } from './QuickFilter'

const meta = {
  title: 'Components/QuickFilter',
  component: QuickFilter,
  args: {
    options: [
      { key: 'open', label: 'Open', count: 128 },
      { key: 'overdue', label: 'Overdue', count: 12 },
      { key: 'awaiting', label: 'Awaiting approval', count: 7 },
      { key: 'mine', label: 'Assigned to me' },
    ],
    multiple: false,
    allLabel: 'All',
    onChange: fn(),
  },
  argTypes: { options: { control: false } },
} satisfies Meta<typeof QuickFilter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /overdue/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['overdue'])
  },
}

export const Multiple: Story = { args: { multiple: true, defaultValue: ['open', 'mine'] } }

export const Disabled: Story = { args: { allLabel: false } }
