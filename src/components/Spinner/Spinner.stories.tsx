import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from './Spinner'

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: { size: 'md', label: 'Loading' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Spinner size='sm' />
      <Spinner size='md' />
      <Spinner size='lg' />
    </div>
  ),
}

export const Silent: Story = {
  args: { label: null },
}

export const Disabled: Story = {
  args: { style: { opacity: 0.4 } },
}
