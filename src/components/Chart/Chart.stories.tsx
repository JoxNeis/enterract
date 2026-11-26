import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Chart } from './Chart'
import { months, regions, revenueVsCost, salesByRegion, shareByRegion } from './Chart.fixtures'

const meta = {
  title: 'Components/Chart',
  component: Chart,
  args: {
    type: 'bar',
    title: 'Revenue vs cost of sales (USD)',
    categories: months,
    series: revenueVsCost,
    height: 280,
    valueFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    allowTable: true,
    directLabels: false,
    caption: 'Source: general ledger, posted entries only.',
  },
  argTypes: {
    type: { control: 'select', options: ['bar', 'stacked-bar', 'line', 'area', 'pie', 'donut'] },
    categories: { control: false },
    series: { control: false },
    valueFormat: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Chart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('img', { name: /^Mar:/ }))
    await expect(await canvas.findByRole('status')).toHaveTextContent('Mar')
  },
}

export const Line: Story = { args: { type: 'line', title: 'Orders by region', series: salesByRegion, valueFormat: undefined, directLabels: true } }

export const Area: Story = { args: { type: 'area', title: 'Revenue', series: revenueVsCost.slice(0, 1) } }

export const Stacked: Story = { args: { type: 'stacked-bar', title: 'Orders by region', series: salesByRegion, valueFormat: undefined } }

export const Donut: Story = { args: { type: 'donut', title: 'Revenue share by region (%)', categories: regions, series: shareByRegion, valueFormat: undefined } }

export const Pie: Story = { args: { type: 'pie', title: 'Revenue share by region (%)', categories: regions, series: shareByRegion, valueFormat: undefined } }

export const Disabled: Story = { args: { allowTable: false } }
