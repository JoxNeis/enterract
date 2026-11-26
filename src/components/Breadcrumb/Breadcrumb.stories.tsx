import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  args: {
    items: [
      { key: 'home', label: 'Home', href: '#' },
      { key: 'sales', label: 'Sales', href: '#sales' },
      { key: 'orders', label: 'Sales orders', href: '#orders' },
      { key: 'so', label: 'SO-2026-1043' },
    ],
    maxItems: 5,
  },
  argTypes: { items: { control: false } },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('SO-2026-1043')).toHaveAttribute('aria-current', 'page')
  },
}

export const Collapsed: Story = {
  args: {
    maxItems: 3,
    items: [
      { key: '1', label: 'Home', href: '#' },
      { key: '2', label: 'Finance', href: '#f' },
      { key: '3', label: 'General ledger', href: '#gl' },
      { key: '4', label: 'Chart of accounts', href: '#coa' },
      { key: '5', label: '1110 Cash' },
    ],
  },
}

export const Disabled: Story = { args: { items: [{ key: 'home', label: 'Home' }] } }
