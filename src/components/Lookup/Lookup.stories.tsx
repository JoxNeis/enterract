import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { formatNumber } from '../../utils/number'
import { Lookup, type LookupProps } from './Lookup'
import { customerSource, type Customer } from './Lookup.fixtures'

type Props = LookupProps<Customer>

function Stateful(args: Props) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <>
      <Lookup<Customer>
        {...args}
        value={value}
        onChange={(key, item) => {
          setValue(key)
          args.onChange?.(key, item)
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
        Value: <code>{JSON.stringify(value)}</code>
      </p>
    </>
  )
}

const meta = {
  title: 'Components/Lookup',
  component: Lookup<Customer>,
  args: {
    label: 'Customer',
    dataSource: customerSource,
    value: null,
    pageSize: 15,
    debounce: 250,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    dataSource: { control: false },
    columns: { control: false },
    displayValue: { control: false },
    selectedItem: { control: false },
    filters: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof Lookup<Customer>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox', { name: 'Customer' }), 'harbor')
    await waitFor(() => expect(screen.getByRole('option', { name: /harbor marine$/i })).toBeVisible())
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('C1008', expect.objectContaining({ name: 'Harbor Marine' }))
  },
}

/** Results with columns (Code, Name, City, Credit limit). Press F4 or ArrowDown to browse. */
export const WithColumns: Story = {
  args: {
    dropdownWidth: '34rem',
    displayValue: (c: Customer) => `${c.code} · ${c.name}`,
    columns: [
      { key: 'code', header: 'Code', width: '5rem' },
      { key: 'name', header: 'Name', width: '2fr' },
      { key: 'city', header: 'City' },
      {
        key: 'creditLimit',
        header: 'Credit limit',
        align: 'end',
        render: (c: Customer) => formatNumber(c.creditLimit, 'en-US'),
      },
    ],
  },
}

export const InitialValue: Story = { args: { value: 'C1005', helpText: 'Label loaded with getByKey' } }

export const Disabled: Story = { args: { disabled: true, value: 'C1001' } }

export const ReadOnly: Story = { args: { readOnly: true, value: 'C1001' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Customer is blocked for new orders', value: 'C1002' } }

export const Compact: Story = { args: { size: 'sm' } }
