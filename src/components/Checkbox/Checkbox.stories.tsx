import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    label: 'Taxable',
    onChange: fn(),
    indeterminate: false,
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    labelPosition: { control: 'inline-radio', options: ['start', 'end'] },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Taxable' })
    await userEvent.click(box)
    await expect(box).toBeChecked()
    await userEvent.keyboard(' ')
    await expect(args.onChange).toHaveBeenLastCalledWith(false, expect.anything())
  },
}

export const Checked: Story = { args: { defaultValue: true } }

export const Indeterminate: Story = { args: { label: 'Select all lines', indeterminate: true } }

export const WithHelpText: Story = { args: { helpText: 'Applies VAT to this line' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: true } }

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: true },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('checkbox'))
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const Required: Story = { args: { label: 'I confirm the goods were received', required: true } }

export const WithError: Story = {
  args: { label: 'I confirm the goods were received', required: true, error: 'Confirm before posting' },
}

export const Compact: Story = { args: { size: 'sm' } }
