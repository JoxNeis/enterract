import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { ApprovalPanel } from './ApprovalPanel'
import { pendingSteps, rejectedSteps } from './ApprovalPanel.fixtures'

const meta = {
  title: 'Components/ApprovalPanel',
  component: ApprovalPanel,
  args: {
    status: 'pending-approval',
    steps: pendingSteps,
    canDecide: true,
    requireApprovalComment: false,
    onApprove: fn(),
    onReject: fn(),
  },
  argTypes: {
    steps: { control: false },
    stages: { control: false },
    status: { control: 'select', options: ['draft', 'pending-approval', 'approved', 'rejected', 'posted'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ApprovalPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Reject' }))
    const dialog = screen.getByRole('alertdialog')
    await userEvent.type(within(dialog).getByRole('textbox'), 'Budget exceeded')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await expect(args.onReject).toHaveBeenCalledWith('Budget exceeded')
  },
}

export const NotMyTurn: Story = { args: { canDecide: false } }

export const Rejected: Story = { args: { status: 'rejected', steps: rejectedSteps, canDecide: false } }

export const CommentRequired: Story = { args: { requireApprovalComment: true } }

export const Disabled: Story = { args: { status: 'approved', canDecide: false } }
