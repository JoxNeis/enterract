import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Chart } from '../Chart'
import { months, revenueVsCost } from '../Chart/Chart.fixtures'
import { Widget } from './Widget'

const meta = {
  title: 'Components/Widget',
  component: Widget,
  args: {
    title: 'Revenue trend',
    subtitle: 'Last 6 months',
    footer: 'Updated 15 Mar 2026, 09:30',
    menuItems: [
      { key: 'refresh', label: 'Refresh' },
      { key: 'export', label: 'Export CSV' },
      { key: 'remove', label: 'Remove from dashboard', danger: true, separatorBefore: true },
    ],
    onMenuSelect: fn(),
    onRetry: fn(),
    loading: false,
    children: (
      <Chart
        type='line'
        title='Revenue vs cost'
        categories={months}
        series={revenueVsCost}
        height={200}
      />
    ),
  },
  argTypes: { children: { control: false }, menuItems: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Widget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Revenue trend options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Refresh' }))
    await expect(args.onMenuSelect).toHaveBeenCalledWith('refresh')
  },
}

export const Loading: Story = { args: { loading: true } }

export const ErrorState: Story = { args: { error: 'Could not load revenue. The reporting service did not respond.' } }

export const Disabled: Story = { args: { menuItems: undefined } }
