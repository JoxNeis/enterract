import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './Label'

const meta = {
  title: 'Components/Label',
  component: Label,
  args: { children: 'Customer', required: false, size: 'md', disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = { args: { required: true } }

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true } }
