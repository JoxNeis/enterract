import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { StatusBadge } from './StatusBadge'
import { documentStatuses } from './statuses'

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  args: { status: 'pending-approval', variant: 'subtle', size: 'md' },
  argTypes: {
    status: { control: 'select', options: Object.keys(documentStatuses) },
    tone: { control: 'select', options: [undefined, 'neutral', 'info', 'success', 'warning', 'danger', 'progress'] },
    variant: { control: 'inline-radio', options: ['subtle', 'solid', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    statusMap: { control: false },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Pending approval')).toHaveAttribute('data-tone', 'warning')
  },
}

export const AllStatuses: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {Object.keys(documentStatuses).map((s) => (
        <StatusBadge
          key={s}
          {...args}
          status={s}
        />
      ))}
    </div>
  ),
}

export const Solid: Story = { args: { variant: 'solid', status: 'posted' } }

export const CustomStatus: Story = {
  args: { status: 'qc', statusMap: { qc: { label: 'Quality check', tone: 'info' } } },
}

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { status: 'cancelled' } }
