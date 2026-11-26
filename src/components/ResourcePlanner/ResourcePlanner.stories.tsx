import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ResourcePlanner } from './ResourcePlanner'
import { bookings, consultants } from './ResourcePlanner.fixtures'

const meta = {
  title: 'Components/ResourcePlanner',
  component: ResourcePlanner,
  args: {
    'aria-label': 'Consultant bookings',
    resources: consultants,
    allocations: bookings,
    start: '2026-03-16',
    days: 14,
    today: '2026-03-17',
    includeWeekends: false,
    onAllocationClick: fn(),
    onCellClick: fn(),
  },
  argTypes: { resources: { control: false }, allocations: { control: false } },
} satisfies Meta<typeof ResourcePlanner>

export default meta
type Story = StoryObj<typeof meta>

/** Dewi is over-booked on 18–19 March (warning icon and outline). */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Delta WMS/ }))
    await expect(args.onAllocationClick).toHaveBeenCalled()
  },
}

export const OneWeek: Story = { args: { days: 7 } }

export const ReadOnly: Story = { args: { onCellClick: undefined } }

export const Disabled: Story = { args: { onCellClick: undefined, onAllocationClick: undefined } }
