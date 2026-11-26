import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Scheduler } from './Scheduler'
import { dockEvents } from './Scheduler.fixtures'

const meta = {
  title: 'Components/Scheduler',
  component: Scheduler,
  args: {
    'aria-label': 'Loading dock schedule',
    events: dockEvents,
    defaultDate: '2026-03-18',
    today: '2026-03-16',
    defaultView: 'workweek',
    startHour: 7,
    endHour: 17,
    slotMinutes: 30,
    onSlotClick: fn(),
    onEventClick: fn(),
    onDateChange: fn(),
  },
  argTypes: { events: { control: false }, defaultView: { control: 'inline-radio', options: ['day', 'workweek', 'week'] } },
} satisfies Meta<typeof Scheduler>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Inbound: Global Steel/ }))
    await expect(args.onEventClick).toHaveBeenCalled()
  },
}

export const DayView: Story = { args: { defaultView: 'day', defaultDate: '2026-03-16' } }

export const FullWeek: Story = { args: { defaultView: 'week' } }

export const ReadOnly: Story = { args: { onSlotClick: undefined } }

export const Disabled: Story = { args: { onSlotClick: undefined, onEventClick: undefined } }
