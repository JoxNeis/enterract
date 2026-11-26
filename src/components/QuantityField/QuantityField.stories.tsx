import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { QuantityField } from './QuantityField'

const units = [
  { key: 'PCS', label: 'Pieces' },
  { key: 'BOX', label: 'Box' },
  { key: 'KG', label: 'Kilogram' },
  { key: 'M', label: 'Meter' },
]

const meta = {
  title: 'Components/QuantityField',
  component: QuantityField,
  args: { label: 'Quantity', unit: 'PCS', defaultValue: 24, onChange: fn(), onUnitChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] }, units: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuantityField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const UnitSelector: Story = {
  args: { unit: undefined, units, defaultUnit: 'KG', unitPrecision: { PCS: 0, BOX: 0, KG: 3, M: 2 }, defaultValue: 12.5 },
  play: async ({ args, canvasElement }) => {
    await userEvent.selectOptions(within(canvasElement).getByRole('combobox', { name: 'Unit of measure' }), 'M')
    await expect(args.onUnitChange).toHaveBeenCalledWith('M', undefined)
  },
}

export const Stepper: Story = { args: { showStepper: true, precision: 0, min: 1 } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Required: Story = { args: { required: true, defaultValue: null } }

export const WithError: Story = { args: { error: 'Only 18 PCS on hand', defaultValue: 24 } }

export const Compact: Story = { args: { size: 'sm' } }
