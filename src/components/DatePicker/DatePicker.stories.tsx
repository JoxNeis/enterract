import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { weekday } from '../../utils/date'
import { DatePicker, type DatePickerProps } from './DatePicker'

function Stateful(args: DatePickerProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <DatePicker
        {...args}
        value={value}
        onChange={(v, e) => {
          setValue(v)
          args.onChange?.(v, e)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Value: <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  args: {
    label: 'Delivery date',
    value: '2026-03-15',
    today: '2026-03-10',
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID', 'ja-JP'] },
    isDateDisabled: { control: false },
    displayFormat: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 260 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { locale: 'en-US' },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Delivery date' })
    await userEvent.clear(input)
    await userEvent.type(input, '04/02/2026')
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-04-02', expect.anything())
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeVisible()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('2026-04-03', undefined)
  },
}

export const LongFormat: Story = { args: { displayFormat: { dateStyle: 'medium' } } }

export const BusinessDaysOnly: Story = {
  args: {
    label: 'Ship date',
    isDateDisabled: (iso: string) => weekday(iso) === 0 || weekday(iso) === 6,
    helpText: 'Weekends are not available',
  },
}

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, value: null } }

export const WithError: Story = { args: { min: '2026-04-01', helpText: 'Must be in April or later' } }

export const Compact: Story = { args: { size: 'sm' } }
