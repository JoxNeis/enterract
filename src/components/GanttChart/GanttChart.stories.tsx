import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { GanttChart, type GanttChartProps, type GanttTask } from './GanttChart'
import { projectTasks } from './GanttChart.fixtures'

function Stateful(args: GanttChartProps) {
  const [tasks, setTasks] = useState<readonly GanttTask[]>(args.tasks)
  return (
    <GanttChart
      {...args}
      tasks={tasks}
      onTaskChange={(t) => {
        setTasks((list) => list.map((x) => (x.id === t.id ? t : x)))
        args.onTaskChange?.(t)
      }}
    />
  )
}

const meta = {
  title: 'Components/GanttChart',
  component: GanttChart,
  args: { 'aria-label': 'ERP rollout plan', tasks: projectTasks, today: '2026-03-16', dayWidth: 28, onTaskChange: fn(), onTaskClick: fn() },
  argTypes: { tasks: { control: false }, dayWidth: { control: { type: 'range', min: 14, max: 48 } } },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof GanttChart>

export default meta
type Story = StoryObj<typeof meta>

/** Focus a bar: ←/→ move it a day, Shift+←/→ change the end date. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    within(canvasElement).getByRole('button', { name: /^User training/ }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onTaskChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-03-24' }))
  },
}

export const Compact: Story = { args: { dayWidth: 16 } }

export const ReadOnly: Story = { args: { onTaskChange: undefined } }

export const Disabled: Story = { args: { onTaskChange: undefined, onTaskClick: undefined, tasks: projectTasks.slice(0, 2) } }
