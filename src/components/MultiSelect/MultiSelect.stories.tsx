import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { warehouseOptions } from '../Select/Select.fixtures'
import { MultiSelect, type MultiSelectProps } from './MultiSelect'

function Stateful(args: MultiSelectProps) {
  const [value, setValue] = useState<readonly string[]>(args.value ?? [])
  return (
    <MultiSelect
      {...args}
      value={value}
      onChange={(v) => {
        setValue(v)
        args.onChange?.(v)
      }}
    />
  )
}

const meta = {
  title: 'Components/MultiSelect',
  component: MultiSelect,
  args: {
    label: 'Warehouses',
    options: warehouseOptions,
    value: [],
    searchable: false,
    maxChips: 3,
    showBulkActions: true,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    options: { control: false },
    value: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...(args as MultiSelectProps)} />,
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Warehouses' }))
    await userEvent.click(screen.getByRole('option', { name: /jakarta main/i }))
    await userEvent.click(screen.getByRole('option', { name: /surabaya/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['JKT-01', 'SBY-01'])
  },
}

export const Searchable: Story = { args: { searchable: true } }

export const ManySelected: Story = { args: { value: ['JKT-01', 'JKT-02', 'SBY-01', 'SG-01', 'DE-01'] } }

export const Disabled: Story = { args: { disabled: true, value: ['JKT-01'] } }

export const ReadOnly: Story = { args: { readOnly: true, value: ['JKT-01', 'DE-02'] } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Pick at least one warehouse' } }

export const Compact: Story = { args: { size: 'sm' } }
