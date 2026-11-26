import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Tag } from './Tag'

const meta = {
  title: 'Components/Tag',
  component: Tag,
  args: { children: 'Jakarta', tone: 'neutral', size: 'md', disabled: false },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'info', 'success', 'warning', 'danger', 'primary'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Removable: Story = {
  args: { onRemove: fn() },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Remove Jakarta' }))
    await expect(args.onRemove).toHaveBeenCalled()
  },
}

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['neutral', 'info', 'success', 'warning', 'danger', 'primary'] as const).map((tone) => (
        <Tag
          key={tone}
          {...args}
          tone={tone}
        >
          {tone}
        </Tag>
      ))}
    </div>
  ),
}

export const Compact: Story = { args: { size: 'sm' } }

export const Disabled: Story = { args: { disabled: true, onRemove: fn() } }
