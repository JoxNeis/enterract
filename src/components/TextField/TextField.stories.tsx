import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { TextField, type TextFieldProps } from './TextField'

function Stateful(args: TextFieldProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <TextField
      {...args}
      value={value}
      onChange={(v, e) => {
        setValue(v)
        args.onChange?.(v, e)
      }}
    />
  )
}

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: {
    label: 'Customer reference',
    value: null,
    placeholder: 'PO-2026-0001',
    helpText: 'Printed on the invoice',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    type: { control: 'select', options: ['text', 'email', 'tel', 'url', 'password', 'search'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    prefix: { control: false },
    suffix: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Customer reference' })
    await userEvent.type(input, 'PO-1')
    await expect(args.onChange).toHaveBeenLastCalledWith('PO-1', expect.anything())
    await userEvent.clear(input)
    await expect(args.onChange).toHaveBeenLastCalledWith(null, expect.anything())
  },
}

export const WithAdornments: Story = {
  args: { label: 'Website', prefix: <Icon name='link' />, suffix: '.com', type: 'url' },
}

export const Disabled: Story = { args: { disabled: true, value: 'PO-2026-0042' } }

export const ReadOnly: Story = {
  args: { readOnly: true, value: 'PO-2026-0042', helpText: 'Posted documents cannot be edited' },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox')
    await userEvent.type(input, 'x')
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const Required: Story = { args: { required: true } }

export const WithError: Story = {
  args: { required: true, value: 'PO-1', error: 'This reference is already used on SO-1043' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  },
}

export const WithWarning: Story = { args: { value: 'po-1', warning: 'References are usually upper case' } }

export const Compact: Story = { args: { size: 'sm', helpText: undefined } }
