import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { TextField } from '../TextField'
import { Tabs } from './Tabs'

const items = [
  {
    key: 'general',
    label: 'General',
    content: (
      <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <TextField label='Customer' />
        <TextField label='Reference' />
      </div>
    ),
  },
  { key: 'lines', label: 'Lines', badge: 12, content: <p>12 order lines.</p> },
  {
    key: 'shipping',
    label: 'Shipping',
    invalid: true,
    content: (
      <TextField
        label='Delivery address'
        error='Required'
        required
      />
    ),
  },
  { key: 'accounting', label: 'Accounting', content: <p>Posting details.</p> },
  { key: 'audit', label: 'Audit log', disabled: true, content: <p>Audit</p> },
]

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: {
    items,
    'aria-label': 'Sales order',
    activation: 'automatic',
    keepMounted: true,
    size: 'md',
    onChange: fn(),
  },
  argTypes: {
    items: { control: false },
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'General' }))
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onChange).toHaveBeenLastCalledWith('lines', undefined)
    await expect(canvas.getByRole('tab', { name: /shipping \(has errors\)/i })).toBeVisible()
  },
}

export const ManualActivation: Story = { args: { activation: 'manual' } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { items: items.map((i) => ({ ...i, disabled: i.key !== 'general' })) } }
