import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import {
  accountSource,
  employeeSource,
  itemSource,
  type SampleAccount,
  type SampleEmployee,
  type SampleItem,
} from '../../test/erpFixtures'
import { initials } from '../../utils/format'
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

/*
 * One Lookup for every kind of master data. There are no CustomerLookup / AccountLookup /
 * ItemLookup components: give Lookup a label, a dataSource, columns and a displayValue.
 * Wrap that in your own app component if you use the same setup on many screens.
 */

function Example<T>(props: Omit<LookupProps<T>, 'value' | 'onChange'>) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Lookup<T>
      {...props}
      value={value}
      onChange={(key) => {
        setValue(key)
      }}
    />
  )
}

/** General ledger account: number, name and type; the input shows `6100 · Salaries`. */
export const GlAccount: Story = {
  render: () => (
    <Example<SampleAccount>
      label='Expense account'
      dataSource={accountSource}
      dropdownWidth='30rem'
      displayValue={(a) => `${a.number} · ${a.name}`}
      columns={[
        { key: 'number', header: 'Account', width: '5rem' },
        { key: 'name', header: 'Name', width: '2fr' },
        { key: 'type', header: 'Type', width: '1fr' },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox', { name: 'Expense account' }), '61')
    await waitFor(() => expect(screen.getByRole('option', { name: /Salaries/ })).toBeVisible())
    await userEvent.keyboard('{Enter}')
    await expect(within(canvasElement).getByRole('combobox', { name: 'Expense account' })).toHaveValue('6100 · Salaries')
  },
}

/** Item: SKU, description, unit and stock on hand (right-aligned number column). */
export const Item: Story = {
  render: () => (
    <Example<SampleItem>
      label='Item'
      dataSource={itemSource}
      dropdownWidth='34rem'
      displayValue={(i) => `${i.sku} · ${i.description}`}
      columns={[
        { key: 'sku', header: 'SKU', width: '6rem' },
        { key: 'description', header: 'Description', width: '2fr' },
        { key: 'uom', header: 'Unit', width: '4rem' },
        { key: 'onHand', header: 'On hand', align: 'end', width: '6rem', render: (i) => formatNumber(i.onHand, 'en-US') },
      ]}
    />
  ),
}

/** Person: initials avatar, name and department (custom `render` in a column). */
export const Person: Story = {
  render: () => (
    <Example<SampleEmployee>
      label='Requested by'
      dataSource={employeeSource}
      dropdownWidth='28rem'
      displayValue={(e) => e.name}
      columns={[
        {
          key: 'avatar',
          header: '',
          width: '2rem',
          render: (e) => (
            <span
              aria-hidden='true'
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                width: 24,
                height: 24,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '50%',
                color: 'var(--erp-color-primary)',
                background: 'var(--erp-color-primary-subtle)',
              }}
            >
              {initials(e.name)}
            </span>
          ),
        },
        { key: 'name', header: 'Name', width: '2fr' },
        { key: 'department', header: 'Department', width: '1fr' },
      ]}
    />
  ),
}
