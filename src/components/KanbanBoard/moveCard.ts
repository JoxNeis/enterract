import type { KanbanCard } from './KanbanBoard'

/** Moves a card in a list to a column and position (pure helper). */
export function moveCard(cards: readonly KanbanCard[], id: string, column: string, index: number): KanbanCard[] {
  const card = cards.find((c) => c.id === id)
  if (!card) return [...cards]
  const rest = cards.filter((c) => c.id !== id)
  const inColumn = rest.filter((c) => c.column === column)
  const before = inColumn[index]
  const moved = { ...card, column }
  if (!before) {
    const last = inColumn[inColumn.length - 1]
    const at = last ? rest.indexOf(last) + 1 : rest.length
    return [...rest.slice(0, at), moved, ...rest.slice(at)]
  }
  const at = rest.indexOf(before)
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}
