import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CommentsPanel } from '../CommentsPanel'
import { comments } from '../CommentsPanel/CommentsPanel.fixtures'
import { SidePanel } from './SidePanel'

const meta = {
  title: 'Components/SidePanel',
  component: SidePanel,
  args: {
    title: 'Comments',
    width: '22rem',
    side: 'right',
    onOpenChange: fn(),
    children: (
      <CommentsPanel
        comments={comments}
        title=''
      />
    ),
  },
  argTypes: { children: { control: false }, side: { control: 'inline-radio', options: ['right', 'left'] } },
  render: (args) => (
    <div style={{ display: 'flex', height: 420, border: '1px solid var(--erp-color-border-subtle)' }}>
      {args.side === 'left' && <SidePanel {...args} />}
      <main style={{ flex: 1, padding: 16 }}>Sales order SO-2026-1043 — main content stays usable.</main>
      {args.side !== 'left' && <SidePanel {...args} />}
    </div>
  ),
} satisfies Meta<typeof SidePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Collapse panel' }))
    await expect(args.onOpenChange).toHaveBeenCalledWith(false, undefined)
  },
}

export const Left: Story = { args: { side: 'left', title: 'Filters', children: 'Filter fields…' } }

export const Collapsed: Story = { args: { defaultOpen: false } }

export const Disabled: Story = { args: { defaultOpen: false, title: 'Audit' } }
