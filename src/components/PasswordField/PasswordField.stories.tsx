import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PasswordField } from './PasswordField'

const meta = {
  title: 'Components/PasswordField',
  component: PasswordField,
  args: { label: 'Password', onChange: fn(), capsLockWarning: true, disabled: false, readOnly: false, required: false, size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Password'), 'hunter2')
    await userEvent.click(canvas.getByRole('button', { name: 'Show password' }))
    await expect(canvas.getByLabelText('Password')).toHaveAttribute('type', 'text')
  },
}

export const NewPassword: Story = { args: { label: 'New password', autoComplete: 'new-password', helpText: 'At least 12 characters' } }

export const Disabled: Story = { args: { disabled: true } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'secret' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Wrong password', defaultValue: 'secret' } }

export const Compact: Story = { args: { size: 'sm' } }
