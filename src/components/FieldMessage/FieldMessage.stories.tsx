import type { Meta, StoryObj } from '@storybook/react-vite'
import { FieldMessage } from './FieldMessage'

const meta = {
  title: 'Components/FieldMessage',
  component: FieldMessage,
  args: { children: 'Enter the amount excluding tax', tone: 'help' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['help', 'error', 'warning', 'success'] },
  },
} satisfies Meta<typeof FieldMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Error: Story = { args: { tone: 'error', children: 'Amount is required' } }

export const Warning: Story = { args: { tone: 'warning', children: 'Credit limit exceeded' } }

export const Success: Story = { args: { tone: 'success', children: 'Tax ID verified' } }

export const Disabled: Story = { args: { style: { opacity: 0.6 } } }
