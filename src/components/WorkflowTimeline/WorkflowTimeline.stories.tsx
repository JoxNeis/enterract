import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { WorkflowTimeline } from './WorkflowTimeline'
import { timelineEvents } from './WorkflowTimeline.fixtures'

const meta = {
  title: 'Components/WorkflowTimeline',
  component: WorkflowTimeline,
  args: { events: timelineEvents },
  argTypes: { events: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkflowTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Finance approval').closest('li')).toHaveAttribute('aria-current', 'step')
  },
}

export const Rejected: Story = {
  args: {
    events: [
      ...timelineEvents.slice(0, 3),
      { id: '4', title: 'Finance approval', state: 'rejected', actor: 'Anna Schmidt', at: '2026-03-15T13:20:00Z', comment: 'Over the quarterly budget.' },
      { id: '5', title: 'Post to ledger', state: 'skipped' },
    ],
  },
}

export const Disabled: Story = { args: { events: timelineEvents.map((e) => ({ ...e, state: 'pending' as const })) } }
