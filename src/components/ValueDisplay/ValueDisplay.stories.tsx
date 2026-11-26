import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ValueDisplay } from './ValueDisplay'

const meta = {
  title: 'Components/ValueDisplay',
  component: ValueDisplay,
  args: { label: 'Invoice total', value: '12480.5', type: 'currency', layout: 'vertical', calculated: false },
  argTypes: {
    type: { control: 'select', options: ['text', 'number', 'currency', 'percent', 'date', 'datetime', 'boolean'] },
    layout: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    value: { control: 'text' },
    render: { control: false },
  },
} satisfies Meta<typeof ValueDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'Invoice total' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('group', { name: 'Invoice total' })).toBeVisible()
  },
}

export const Calculated: Story = { args: { label: 'Line total', calculated: 'Quantity × Unit price − Discount' } }

export const DetailPanel: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
      <ValueDisplay
        layout='horizontal'
        label='Customer'
        value='C1008 · Harbor Marine'
      />
      <ValueDisplay
        layout='horizontal'
        label='Order date'
        type='date'
        value='2026-03-15'
      />
      <ValueDisplay
        layout='horizontal'
        label='Discount'
        type='percent'
        value={0.05}
      />
      <ValueDisplay
        layout='horizontal'
        label='Taxable'
        type='boolean'
        value
      />
      <ValueDisplay
        layout='horizontal'
        label='Reference'
        value={null}
      />
    </div>
  ),
}

export const Empty: Story = { args: { value: null } }

export const Disabled: Story = { args: { value: null, emptyText: 'Not set' } }
