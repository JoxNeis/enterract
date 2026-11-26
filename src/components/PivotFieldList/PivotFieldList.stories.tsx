import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { PivotFieldList } from './PivotFieldList'

const meta = {
  title: 'Components/PivotFieldList',
  component: PivotFieldList,
  args: {
    fields: [
      { key: 'region', label: 'Region' },
      { key: 'category', label: 'Category' },
      { key: 'quarter', label: 'Quarter' },
      { key: 'revenue', label: 'Revenue', numeric: true },
      { key: 'orders', label: 'Orders', numeric: true },
    ],
    defaultValue: { rows: ['region'], columns: ['quarter'], values: [{ field: 'revenue', aggregate: 'sum' }] },
    onChange: fn(),
  },
  argTypes: { fields: { control: false }, defaultValue: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PivotFieldList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Add to Rows' }))
    await userEvent.click(screen.getByRole('option', { name: 'Category' }))
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Empty: Story = { args: { defaultValue: { rows: [], columns: [], values: [] } } }

export const Disabled: Story = { args: { defaultValue: { rows: ['region', 'category'], columns: ['quarter'], values: [] } } }
