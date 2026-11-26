import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CalculatorField } from './CalculatorField'

const meta = {
  title: 'Components/CalculatorField',
  component: CalculatorField,
  args: { label: 'Freight cost', precision: 2, onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CalculatorField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('textbox'), '=12*3.5{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith(42, undefined)
  },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: 120 } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 120 } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { max: 100, defaultValue: 150 } }

export const Compact: Story = { args: { size: 'sm' } }
