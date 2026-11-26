import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { masks } from './mask'
import { MaskedField } from './MaskedField'

const meta = {
  title: 'Components/MaskedField',
  component: MaskedField,
  args: { label: 'Phone', mask: masks.phoneUS, valueMode: 'raw', onChange: fn(), disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: {
    mask: { control: 'select', options: Object.values(masks) },
    valueMode: { control: 'inline-radio', options: ['raw', 'masked'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MaskedField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox')
    await userEvent.type(input, '5551234567')
    await expect(input).toHaveValue('(555) 123-4567')
    await expect(args.onChange).toHaveBeenLastCalledWith('5551234567', expect.anything())
  },
}

export const TaxId: Story = { args: { label: 'NPWP (tax ID)', mask: masks.npwp, valueMode: 'masked' } }

export const Iban: Story = { args: { label: 'IBAN', mask: masks.ibanDE } }

export const IndonesianPhone: Story = { args: { label: 'Mobile', mask: masks.phoneID } }

export const PostalCode: Story = { args: { label: 'ZIP code', mask: masks.postalUS } }

export const Disabled: Story = { args: { disabled: true, defaultValue: '5551234567' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: '5551234567' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { defaultValue: '555', error: 'Phone number is incomplete' } }

export const Compact: Story = { args: { size: 'sm' } }
