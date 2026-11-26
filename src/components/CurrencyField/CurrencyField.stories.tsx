import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CurrencyField, type CurrencyFieldProps } from './CurrencyField'

function Stateful(args: CurrencyFieldProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <CurrencyField
        {...args}
        value={value}
        onChange={(v, e) => {
          setValue(v)
          args.onChange?.(v, e)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Emitted value (decimal string): <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/CurrencyField',
  component: CurrencyField,
  args: {
    label: 'Unit price',
    value: '1234.5',
    currency: 'USD',
    onChange: fn(),
    onCurrencyChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    currency: { control: 'select', options: ['USD', 'EUR', 'JPY', 'IDR', 'GBP'] },
    currencyDisplay: { control: 'inline-radio', options: ['symbol', 'narrowSymbol', 'code'] },
    locale: { control: 'select', options: [undefined, 'en-US', 'de-DE', 'id-ID', 'ja-JP'] },
    currencies: { control: false },
    prefix: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof CurrencyField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Unit price' })
    await expect(input).toHaveValue('$1,234.50')
    await userEvent.clear(input)
    await userEvent.type(input, '0.1')
    await expect(args.onChange).toHaveBeenLastCalledWith('0.1', expect.anything())
  },
}

export const CurrencySelector: Story = {
  args: { currency: undefined, defaultCurrency: 'EUR', currencies: ['EUR', 'USD', 'GBP', 'JPY'] },
}

export const ZeroDecimals: Story = { args: { currency: 'JPY', value: '150000', label: 'Amount (JPY)' } }

export const Euro: Story = { args: { currency: 'EUR', locale: 'de-DE', label: 'Betrag' } }

export const NoNegative: Story = { args: { allowNegative: false, value: '-10', label: 'Payment' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, value: null } }

export const WithError: Story = { args: { max: '1000', value: '1500', label: 'Credit note' } }

export const Compact: Story = { args: { size: 'sm' } }
