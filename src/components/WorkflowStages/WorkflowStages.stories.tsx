import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { documentStages } from './stages'
import { WorkflowStages } from './WorkflowStages'

const meta = {
  title: 'Components/WorkflowStages',
  component: WorkflowStages,
  args: { current: 'submitted', currentState: 'active', orientation: 'horizontal', size: 'md' },
  argTypes: {
    current: { control: 'inline-radio', options: documentStages.map((s) => s.key) },
    currentState: { control: 'inline-radio', options: ['active', 'rejected', 'complete'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    stages: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkflowStages>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Submitted').closest('li')).toHaveAttribute('aria-current', 'step')
  },
}

export const Rejected: Story = { args: { currentState: 'rejected' } }

export const Complete: Story = { args: { current: 'posted', currentState: 'complete' } }

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    stages: [
      { key: 'requested', label: 'Requested', description: 'Dewi Lestari · 14 Mar' },
      { key: 'manager', label: 'Manager approval', description: 'Rudi Hartono · 15 Mar' },
      { key: 'finance', label: 'Finance approval', description: 'Waiting for Anna Schmidt' },
      { key: 'ordered', label: 'Ordered' },
    ],
    current: 'finance',
  },
}

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { current: 'draft' } }
