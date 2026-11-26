import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from '../Button'
import { Badge } from './Badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { count: 7, max: 99, showZero: false, dot: false, tone: 'primary' },
  argTypes: { tone: { control: 'select', options: ['neutral', 'primary', 'danger', 'success', 'warning'] } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('7')).toBeVisible()
  },
}

export const Overflow: Story = { args: { count: 1250 } }

export const Dot: Story = { args: { dot: true, tone: 'danger', 'aria-label': 'Unread' } }

export const OnButton: Story = {
  render: (args) => (
    <Button iconEnd={<Badge {...args} />}>Approvals</Button>
  ),
}

export const Disabled: Story = { args: { count: 0, showZero: true, tone: 'neutral' } }
