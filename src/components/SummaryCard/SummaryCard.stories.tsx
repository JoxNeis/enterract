import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Link } from '../Link'
import { StatusBadge } from '../StatusBadge'
import { SummaryCard } from './SummaryCard'

const meta = {
  title: 'Components/SummaryCard',
  component: SummaryCard,
  args: {
    title: 'Customer balance',
    adornment: <StatusBadge status='active' size='sm' />,
    items: [
      { label: 'Credit limit', value: '50000', type: 'currency' },
      { label: 'Open invoices', value: '12480.5', type: 'currency' },
      { label: 'Overdue', value: '3200', type: 'currency' },
      { label: 'Available', value: '37519.5', type: 'currency', emphasis: true },
    ],
    footer: <Link href='#statement'>View statement</Link>,
  },
  argTypes: { items: { control: false }, adornment: { control: false }, footer: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SummaryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('group', { name: 'Available' })).toHaveTextContent('$37,519.50')
  },
}

export const OrderTotals: Story = {
  args: {
    title: 'Order totals',
    adornment: undefined,
    footer: undefined,
    items: [
      { label: 'Subtotal', value: '1240', type: 'currency' },
      { label: 'Discount', value: '-62', type: 'currency' },
      { label: 'Tax (11%)', value: '129.58', type: 'currency' },
      { label: 'Total', value: '1307.58', type: 'currency', emphasis: true },
    ],
  },
}

export const Disabled: Story = { args: { items: [{ label: 'Balance', value: null }] } }
