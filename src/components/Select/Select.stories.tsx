import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { Select, type SelectProps } from './Select'
import { uomOptions, warehouseOptions } from './Select.fixtures'

function Stateful(args: SelectProps) {
  const [value, setValue] = useState(args.value ?? null)
  return (
    <Select
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
  title: 'Components/Select',
  component: Select,
  args: {
    label: 'Unit of measure',
    options: uomOptions,
    value: null,
    placeholder: 'Select…',
    clearable: false,
    loading: false,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    options: { control: false },
    renderValue: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...(args as SelectProps)} />,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const combo = within(canvasElement).getByRole('combobox', { name: 'Unit of measure' })
    combo.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('BOX')
    await expect(combo).toHaveTextContent('Box')
  },
}

export const Grouped: Story = { args: { label: 'Warehouse', options: warehouseOptions, value: 'SBY-01' } }

export const Clearable: Story = { args: { clearable: true, value: 'KG' } }

export const Loading: Story = { args: { loading: true, options: [] } }

export const MouseSelection: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: /meter/i }))
    await expect(within(canvasElement).getByRole('combobox')).toHaveTextContent('Meter')
  },
}

export const Disabled: Story = { args: { disabled: true, value: 'PCS' } }

export const ReadOnly: Story = { args: { readOnly: true, value: 'PCS' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { required: true, error: 'Choose a unit' } }

export const Compact: Story = { args: { size: 'sm' } }
