import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { ActivityFeed } from './ActivityFeed'
import { activity } from './ActivityFeed.fixtures'

const meta = {
  title: 'Components/ActivityFeed',
  component: ActivityFeed,
  args: { entries: activity, hasMore: true, onLoadMore: fn() },
  argTypes: { entries: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityFeed>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('listitem')).toHaveLength(4)
  },
}

export const Empty: Story = { args: { entries: [], hasMore: false } }

export const Disabled: Story = { args: { hasMore: false } }
