import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { LocaleProvider } from '../LocaleProvider'
import { NumberField, type NumberFieldProps } from './NumberField'

function Stateful(args: NumberFieldProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <NumberField
        {...args}
        value={value}
        onChange={(v, e) => {
          setValue(v)
          args.onChange?.(v, e)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Emitted value: <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  args: {
    label: 'Quantity',
    value: 1234.5,
    onChange: fn(),
    showStepper: false,
    step: 1,
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'fr-FR', 'id-ID'] },
    prefix: { control: false },
    suffix: { control: false },
    formatOptions: { control: false },
    messages: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 260 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Quantity' })
    await expect(input).toHaveValue('1,234.5')
    await userEvent.click(input)
    await expect(input).toHaveValue('1234.5')
    await userEvent.clear(input)
    await userEvent.type(input, '42')
    await expect(args.onChange).toHaveBeenLastCalledWith(42, expect.anything())
  },
}

/** `12abc` stays as typed, is marked invalid and emits nothing. */
export const NoSilentCoercion: Story = {
  args: { value: null },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox')
    await userEvent.type(input, '12abc')
    await userEvent.tab()
    await expect(input).toHaveValue('12abc')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  },
}

export const Integer: Story = { args: { label: 'Units', precision: 0, value: 12, helpText: 'precision={0}' } }

export const Stepper: Story = { args: { label: 'Copies', showStepper: true, min: 1, max: 10, value: 1, precision: 0 } }

export const WithUnit: Story = { args: { label: 'Weight', suffix: 'kg', precision: 3, value: 12.5 } }

export const Locale: Story = {
  args: { label: 'Betrag', value: 1234.5 },
  render: (args) => (
    <LocaleProvider locale='de-DE'>
      <Stateful {...args} />
    </LocaleProvider>
  ),
}

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, value: null } }

export const WithError: Story = { args: { label: 'Discount %', max: 100, value: 120 } }

export const Compact: Story = { args: { size: 'sm' } }
