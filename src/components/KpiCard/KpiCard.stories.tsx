import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { KpiCard } from './KpiCard'

const meta = {
  title: 'Components/KpiCard',
  component: KpiCard,
  args: {
    label: 'Revenue (MTD)',
    value: '$248,900',
    delta: 0.077,
    deltaLabel: 'vs last month',
    goodDirection: 'up',
    trend: [182, 196, 214, 205, 231, 248],
  },
  argTypes: { goodDirection: { control: 'inline-radio', options: ['up', 'down'] }, trend: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KpiCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region')).toHaveTextContent('+7.7 %')
  },
}

export const CostGoingUp: Story = { args: { label: 'Overdue receivables', value: '$48,210', delta: 0.12, goodDirection: 'down', trend: [30, 34, 39, 41, 43, 48] } }

export const Drillable: Story = { args: { onDrill: fn(), label: 'Open orders', value: '128', delta: -0.04, trend: undefined } }

export const Dashboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 240px)', gap: 12 }}>
      <KpiCard
        label='Revenue (MTD)'
        value='$248,900'
        delta={0.077}
        trend={[182, 196, 214, 205, 231, 248]}
      />
      <KpiCard
        label='Gross margin'
        value='36.2 %'
        delta={-0.011}
        trend={[35, 36, 37, 36, 37, 36]}
      />
      <KpiCard
        label='Overdue'
        value='$48,210'
        delta={0.12}
        goodDirection='down'
        trend={[30, 34, 39, 41, 43, 48]}
      />
    </div>
  ),
}

export const Disabled: Story = { args: { delta: undefined, trend: undefined } }
