import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { DateTimePicker, type DateTimePickerProps } from './DateTimePicker'

function Stateful(args: DateTimePickerProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <DateTimePicker
        {...args}
        value={value}
        onChange={(v) => {
          setValue(v)
          args.onChange?.(v)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Value: <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
  args: {
    label: 'Goods receipt',
    value: '2026-03-15T02:30:00Z',
    timeZone: 'Asia/Jakarta',
    today: '2026-03-15',
    step: 30,
    showTimeZone: true,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    timeZone: { control: 'select', options: ['UTC', 'Asia/Jakarta', 'Europe/Berlin', 'America/New_York'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof DateTimePicker>

export default meta
type Story = StoryObj<typeof meta>

/** The same instant shown in Jakarta. Switch `timeZone` to see it move. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: /time/i })).toHaveValue('9:30 AM')
  },
}

export const Berlin: Story = { args: { timeZone: 'Europe/Berlin' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, value: null } }

export const WithError: Story = { args: { error: 'Receipt cannot be in the future' } }

export const Compact: Story = { args: { size: 'sm' } }
