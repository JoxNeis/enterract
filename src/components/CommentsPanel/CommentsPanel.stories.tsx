import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CommentsPanel, type Comment, type CommentsPanelProps } from './CommentsPanel'
import { comments, currentUser } from './CommentsPanel.fixtures'

function Stateful(args: CommentsPanelProps) {
  const [list, setList] = useState<Comment[]>([...args.comments])
  return (
    <CommentsPanel
      {...args}
      comments={list}
      onAdd={(text, opts) => {
        setList((l) => [
          ...l,
          { id: `c${String(l.length + 1)}`, author: currentUser, createdAt: '2026-03-15T12:00:00Z', text, internal: opts.internal },
        ])
        void args.onAdd?.(text, opts)
      }}
      onEdit={(id, text) => {
        setList((l) => l.map((c) => (c.id === id ? { ...c, text, editedAt: '2026-03-15T12:05:00Z' } : c)))
        void args.onEdit?.(id, text)
      }}
      onDelete={(id) => {
        setList((l) => l.filter((c) => c.id !== id))
        void args.onDelete?.(id)
      }}
    />
  )
}

const meta = {
  title: 'Components/CommentsPanel',
  component: CommentsPanel,
  args: {
    comments,
    currentUserId: currentUser.id,
    allowInternal: true,
    readOnly: false,
    order: 'oldest-first',
    onAdd: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
  argTypes: {
    comments: { control: false },
    order: { control: 'inline-radio', options: ['oldest-first', 'newest-first'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 520 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof CommentsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'New comment' }), 'Shipped today{Control>}{Enter}{/Control}')
    await expect(args.onAdd).toHaveBeenCalledWith('Shipped today', { internal: false })
    await expect(canvas.getByText('Shipped today')).toBeVisible()
  },
}

export const NewestFirst: Story = { args: { order: 'newest-first' } }

export const ReadOnly: Story = { args: { readOnly: true } }

export const Empty: Story = { args: { comments: [] } }

export const Disabled: Story = { args: { readOnly: true, currentUserId: undefined } }
