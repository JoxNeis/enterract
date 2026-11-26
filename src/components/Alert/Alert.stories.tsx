import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { Alert } from './Alert'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: {
    tone: 'info',
    title: 'Exchange rate updated',
    children: 'Prices on this order were recalculated with today\u2019s EUR rate.',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] },
    live: { control: 'inline-radio', options: [undefined, 'assertive', 'polite', 'off'] },
    errors: { control: false },
    actions: { control: false },
    icon: { control: false },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Success: Story = { args: { tone: 'success', title: 'Invoice posted', children: 'INV-2026-0142 was posted to the ledger.' } }

export const Warning: Story = {
  args: { tone: 'warning', title: 'Credit limit exceeded', children: 'This order brings Acme to 112% of its limit.' },
}

export const ErrorBanner: Story = {
  args: {
    tone: 'error',
    title: 'Please fix 2 fields before saving',
    children: undefined,
    errors: [
      { fieldId: 'demo-customer', label: 'Customer', message: 'Required' },
      { fieldId: 'demo-date', label: 'Delivery date', message: 'Must be after the order date' },
    ],
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <Alert {...args} />
      <label>
        Customer <input id='demo-customer' />
      </label>
      <label>
        Delivery date <input id='demo-date' />
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('link', { name: /delivery date/i }))
    await expect(canvas.getByLabelText('Delivery date')).toHaveFocus()
  },
}

export const Dismissible: Story = {
  args: { onDismiss: fn() },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Dismiss' }))
    await expect(args.onDismiss).toHaveBeenCalled()
  },
}

export const WithActions: Story = {
  args: {
    tone: 'warning',
    title: 'Unsaved changes',
    children: 'You have 3 changed lines.',
    actions: (
      <>
        <Button size='sm'>Discard</Button>
        <Button
          size='sm'
          variant='primary'
        >
          Save
        </Button>
      </>
    ),
  },
}

export const Disabled: Story = { args: { style: { opacity: 0.6 } } }
