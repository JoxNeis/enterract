import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ComponentType } from 'react'
import { RangeFilter, type NumberRangeFilterProps, type RangeValue } from './RangeFilter'

/** RangeFilter's props are a union by `type`; stories use one flat shape for the Controls panel. */
type StoryProps = Omit<NumberRangeFilterProps, 'type' | 'value' | 'defaultValue' | 'onChange'> & {
  type: 'number' | 'date' | 'currency'
  value?: RangeValue<number | string> | null
  defaultValue?: RangeValue<number | string> | null
  onChange?: (value: RangeValue<number | string>) => void
  currency?: string
}
const RangeFilterStory = RangeFilter as unknown as ComponentType<StoryProps>

const meta = {
  title: 'Components/RangeFilter',
  component: RangeFilterStory,
  args: { type: 'number', label: 'Quantity', onChange: fn(), disabled: false, readOnly: false, size: 'md' },
  argTypes: {
    type: { control: 'inline-radio', options: ['number', 'date', 'currency'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RangeFilterStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Quantity From' }), '10')
    await userEvent.type(canvas.getByRole('textbox', { name: 'Quantity To' }), '5')
    await expect(args.onChange).toHaveBeenLastCalledWith({ from: 10, to: 5 }, undefined)
    await expect(canvas.getByText('The start is after the end')).toBeVisible()
  },
}

export const Dates: Story = { args: { type: 'date', label: 'Order date', defaultValue: { from: '2026-03-01', to: '2026-03-31' } } }

export const Amounts: Story = { args: { type: 'currency', label: 'Invoice total', currency: 'EUR' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: { from: 1, to: 100 } } }

export const Compact: Story = { args: { size: 'sm' } }
