import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { RadioGroup } from './RadioGroup'

const terms = [
  { key: 'net30', label: 'Net 30' },
  { key: 'net60', label: 'Net 60', description: 'Needs finance approval' },
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'cod', label: 'Cash on delivery', disabled: true },
]

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Payment terms',
    options: terms,
    orientation: 'vertical',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    options: { control: false },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Net 30' }))
    await userEvent.keyboard('{ArrowDown}')
    await expect(args.onChange).toHaveBeenLastCalledWith('net60', expect.anything())
  },
}

export const Horizontal: Story = { args: { orientation: 'horizontal', defaultValue: 'net30' } }

export const Disabled: Story = { args: { disabled: true, defaultValue: 'net30' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'net60' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Choose payment terms' } }

export const Compact: Story = { args: { size: 'sm' } }
