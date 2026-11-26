import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CheckboxGroup } from './CheckboxGroup'

const options = [
  { key: 'email', label: 'Email', description: 'Invoices and statements' },
  { key: 'portal', label: 'Customer portal' },
  { key: 'edi', label: 'EDI' },
  { key: 'fax', label: 'Fax', disabled: true },
]

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  args: {
    label: 'Send documents by',
    options,
    orientation: 'vertical',
    selectAll: false,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    options: { control: false },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof CheckboxGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('checkbox', { name: 'EDI' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['edi'])
  },
}

export const SelectAll: Story = { args: { selectAll: true, defaultValue: ['email'] } }

export const Horizontal: Story = { args: { orientation: 'horizontal' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: ['email'] } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: ['email', 'edi'] } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Choose at least one channel' } }

export const Compact: Story = { args: { size: 'sm' } }
