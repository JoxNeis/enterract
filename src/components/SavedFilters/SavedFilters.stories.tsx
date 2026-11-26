import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { SavedFilters, type SavedFiltersProps, type SavedView } from './SavedFilters'

const initial: SavedView[] = [
  { id: 'v1', name: 'All orders', filters: {}, isDefault: true, shared: true },
  { id: 'v2', name: 'My open orders', filters: { status: 'open', owner: 'me' }, favorite: true },
  { id: 'v3', name: 'Overdue > 30 days', filters: { overdueDays: 30 } },
]

function Stateful(args: SavedFiltersProps) {
  const [views, setViews] = useState<SavedView[]>([...args.views])
  const [active, setActive] = useState(args.activeId)
  return (
    <SavedFilters
      {...args}
      views={views}
      activeId={active}
      onSelect={(v) => {
        setActive(v.id)
        args.onSelect(v)
      }}
      onSave={({ name, isDefault }) => {
        const id = `v${String(views.length + 1)}`
        setViews((list) => [...list.map((v) => (isDefault ? { ...v, isDefault: false } : v)), { id, name, filters: {}, isDefault }])
        setActive(id)
        args.onSave?.({ name, isDefault })
      }}
      onDelete={(id) => {
        setViews((list) => list.filter((v) => v.id !== id))
        args.onDelete?.(id)
      }}
      onToggleFavorite={(id) => {
        setViews((list) => list.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)))
        args.onToggleFavorite?.(id)
      }}
      onSetDefault={(id) => {
        setViews((list) => list.map((v) => ({ ...v, isDefault: v.id === id })))
        args.onSetDefault?.(id)
      }}
    />
  )
}

const meta = {
  title: 'Components/SavedFilters',
  component: SavedFilters,
  args: {
    views: initial,
    activeId: 'v2',
    modified: false,
    onSelect: fn(),
    onSave: fn(),
    onUpdate: fn(),
    onDelete: fn(),
    onToggleFavorite: fn(),
    onSetDefault: fn(),
  },
  argTypes: { views: { control: false } },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof SavedFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /my open orders/i }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Overdue > 30 days' }))
    await expect(args.onSelect).toHaveBeenCalled()
  },
}

export const Modified: Story = { args: { modified: true } }

export const Disabled: Story = { args: { onSave: undefined, onDelete: undefined, onToggleFavorite: undefined, onSetDefault: undefined } }
