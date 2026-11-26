import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KanbanBoard } from './KanbanBoard'
import { cards, columns } from './KanbanBoard.fixtures'
import { moveCard } from './moveCard'

const card = (id: string) => {
  const el = screen.getByText(new RegExp(`^${id}`)).closest('li')
  if (!el) throw new Error(`card ${id} missing`)
  return el
}

describe('moveCard', () => {
  it('moves a card to a column and position', () => {
    const next = moveCard(cards, 'SO-1041', 'picking', 1)
    expect(next.filter((c) => c.column === 'picking').map((c) => c.id)).toEqual(['SO-1043', 'SO-1041', 'SO-1044'])
  })
})

describe('KanbanBoard', () => {
  it('renders columns with counts and WIP warnings', () => {
    render(
      <KanbanBoard
        aria-label='Fulfilment'
        columns={columns}
        cards={cards}
        today='2026-03-15'
        className='extra'
      />
    )
    expect(screen.getByRole('region', { name: 'Fulfilment' })).toHaveClass('erp-kanban', 'extra')
    expect(screen.getByRole('region', { name: 'Packing, 3 cards, limit 2' })).toHaveAttribute('data-over-limit', 'true')
    expect(screen.getByRole('img', { name: 'Over the work-in-progress limit' })).toBeInTheDocument()
    expect(within(card('SO-1042')).getByText(/overdue/)).toBeInTheDocument()
  })

  it('moves a card with the keyboard and announces it', async () => {
    const onCardMove = vi.fn()
    render(
      <KanbanBoard
        aria-label='Fulfilment'
        columns={columns}
        cards={cards}
        onCardMove={onCardMove}
      />
    )
    card('SO-1041').focus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('status')).toHaveTextContent('Picked up SO-1041')
    await userEvent.keyboard('{ArrowRight}{ArrowDown} ')
    expect(onCardMove).toHaveBeenCalledWith('SO-1041', 'picking', 1)
    expect(screen.getByRole('status')).toHaveTextContent('Dropped SO-1041 · Acme Trading in Picking, position 2')
  })

  it('cancels with Escape and opens with Enter', async () => {
    const onCardMove = vi.fn()
    const onCardOpen = vi.fn()
    render(
      <KanbanBoard
        aria-label='Fulfilment'
        columns={columns}
        cards={cards}
        onCardMove={onCardMove}
        onCardOpen={onCardOpen}
      />
    )
    card('SO-1043').focus()
    await userEvent.keyboard(' {ArrowLeft}{Escape}')
    expect(onCardMove).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Move cancelled')
    await userEvent.keyboard('{Enter}')
    expect(onCardOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'SO-1043' }))
  })

  it('drops a dragged card into another column', () => {
    const onCardMove = vi.fn()
    render(
      <KanbanBoard
        aria-label='Fulfilment'
        columns={columns}
        cards={cards}
        onCardMove={onCardMove}
      />
    )
    const dataTransfer = new DataTransfer()
    fireEvent.dragStart(card('SO-1045'), { dataTransfer })
    const shipped = screen.getByRole('region', { name: /^Shipped/ })
    fireEvent.dragOver(shipped, { dataTransfer })
    fireEvent.drop(shipped, { dataTransfer })
    expect(onCardMove).toHaveBeenCalledWith('SO-1045', 'shipped', 1)
  })
})
