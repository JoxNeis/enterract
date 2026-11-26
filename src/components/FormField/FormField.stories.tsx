import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { InputShell } from '../../internal/InputShell'
import { FormField } from './FormField'

const meta = {
  title: 'Components/FormField',
  component: FormField,
  args: {
    label: 'Reference',
    helpText: 'Shown on the printed document',
    required: false,
    disabled: false,
    readOnly: false,
    hideLabel: false,
    size: 'md',
    layout: 'vertical',
    children: (field) => (
      <InputShell
        invalid={field.invalid}
        size='md'
      >
        <input
          className='erp-input-shell__input'
          {...field.controlProps}
        />
      </InputShell>
    ),
  },
  argTypes: {
    children: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    layout: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Reference' })
    await expect(input).toHaveAccessibleDescription('Shown on the printed document')
  },
}

export const Required: Story = { args: { required: true } }

export const WithError: Story = {
  args: { error: 'Reference is already used', required: true },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Reference' })
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  },
}

export const WithWarning: Story = { args: { warning: 'Looks like a duplicate' } }

export const Horizontal: Story = { args: { layout: 'horizontal' } }

export const HiddenLabel: Story = { args: { hideLabel: true, helpText: undefined } }

export const Compact: Story = { args: { size: 'sm' } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Disabled: Story = { args: { disabled: true } }
