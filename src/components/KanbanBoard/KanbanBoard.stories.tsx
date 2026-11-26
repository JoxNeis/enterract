import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { KanbanBoard, type KanbanBoardProps, type KanbanCard } from './KanbanBoard'
import { cards, columns } from './KanbanBoard.fixtures'
import { moveCard } from './moveCard'

function Stateful(args: KanbanBoardProps) {
  const [list, setList] = useState<readonly KanbanCard[]>(args.cards)
  return (
    <KanbanBoard
      {...args}
      cards={list}
      onCardMove={(id, column, index) => {
        setList((l) => moveCard(l, id, column, index))
        args.onCardMove?.(id, column, index)
      }}
    />
  )
}

const meta = {
  title: 'Components/KanbanBoard',
  component: KanbanBoard,
  args: { 'aria-label': 'Order fulfilment', columns, cards, today: '2026-03-15', onCardMove: fn(), onCardOpen: fn() },
  argTypes: { columns: { control: false }, cards: { control: false }, renderCard: { control: false } },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof KanbanBoard>

export default meta
type Story = StoryObj<typeof meta>

/** Drag cards, or focus one and press Space, arrows, Space. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const first = within(canvasElement).getByText(/^SO-1041/).closest('li')
    first?.focus()
    await userEvent.keyboard(' {ArrowRight} ')
    await expect(args.onCardMove).toHaveBeenCalledWith('SO-1041', 'picking', 0)
  },
}

export const ReadOnly: Story = { args: { onCardMove: undefined } }

export const Disabled: Story = { args: { onCardMove: undefined, onCardOpen: undefined } }
