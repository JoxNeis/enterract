import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PercentField, type PercentFieldProps } from './PercentField'

function Stateful(args: PercentFieldProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <PercentField
        {...args}
        value={value}
        onChange={(v, e) => {
          setValue(v)
          args.onChange?.(v, e)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Stored value: <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/PercentField',
  component: PercentField,
  args: { label: 'Discount', value: 0.15, valueMode: 'fraction', precision: 2, onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: {
    valueMode: { control: 'inline-radio', options: ['fraction', 'percent'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof PercentField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '12.5')
    await expect(args.onChange).toHaveBeenLastCalledWith(0.125, expect.anything())
  },
}

export const PercentMode: Story = { args: { valueMode: 'percent', value: 11, label: 'VAT rate' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, value: null } }

export const WithError: Story = { args: { max: 50, value: 0.75, helpText: 'Max 50%' } }

export const Compact: Story = { args: { size: 'sm' } }
