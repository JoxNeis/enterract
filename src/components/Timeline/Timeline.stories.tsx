import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Timeline } from './Timeline'
import { contractMilestones } from './Timeline.fixtures'

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  args: { 'aria-label': 'Contract milestones', items: contractMilestones, today: '2026-03-16', orientation: 'horizontal' },
  argTypes: { items: { control: false }, orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 900, paddingTop: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(5)
  },
}

export const Vertical: Story = { args: { orientation: 'vertical' } }

export const Disabled: Story = { args: { items: contractMilestones.slice(0, 2) } }
